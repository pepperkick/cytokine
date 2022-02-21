import {
  BadRequestException,
  forwardRef,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as config from '../../../config.json';
import { Lobby } from './lobby.model';
import { Client } from '../clients/client.model';
import { MatchService } from '../matches/match.service';
import { LobbyRequestDto } from './lobby-request.dto';
import { PlayerJoinRequestDto } from './player-join-request.dto';
import { LobbyStatus } from './lobby-status.enum';
import { DistributorService } from '../distributor/distributor.service';
import { MatchStatus } from '../matches/match-status.enum';

export const LOBBY_ACTIVE_STATUS_CONDITION = [
  { status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS },
  { status: LobbyStatus.DISTRIBUTING },
  { status: LobbyStatus.DISTRIBUTED },
];

export class LobbyService {
  private readonly logger = new Logger(LobbyService.name);

  constructor(
    @InjectModel(Lobby.name) private repository: Model<Lobby>,
    @Inject(forwardRef(() => MatchService)) private matchService: MatchService,
    private distributorService: DistributorService,
  ) {
    if (config.monitoring.enabled === true) {
      setInterval(async () => {
        await this.monitor();
      }, config.monitoring.interval * 1000);
    }
  }

  /**
   * Get lobby by id
   *
   * @param id - Lobby ID
   */
  async getById(id: string): Promise<Lobby> {
    let object;

    try {
      object = await this.repository.findById(id);
    } catch (exception) {
      throw new NotFoundException();
    }

    if (!object) throw new NotFoundException();

    return object;
  }

  /**
   * Get lobby by id from specific client
   *
   * @param client - Client Object
   * @param id - Lobby ID
   */
  async getByIdForClient(client: Client, id: string): Promise<Lobby> {
    let object;

    try {
      object = await this.repository.findById(id);
    } catch (exception) {
      throw new NotFoundException();
    }

    if (!object) throw new NotFoundException();

    if (client.id !== object.client) throw new NotFoundException();

    return object;
  }

  /**
   * Get all lobbies by client
   *
   * @param client
   */
  async getAllByClient(client: Client): Promise<Lobby[]> {
    return this.repository.find({ client: client.id }).limit(50);
  }

  /**
   * Get a lobby by match ID
   * @param id Match ID
   * @returns
   */
  async getByMatchId(id: string): Promise<Lobby> {
    return this.repository.findOne({ match: id });
  }

  /**
   * Get active lobbies
   *
   * @param client
   */
  async getAllActiveByClient(client: Client): Promise<Lobby[]> {
    return this.repository.find({
      client: client.id,
      $or: LOBBY_ACTIVE_STATUS_CONDITION,
    });
  }

  /**
   * Get active lobbies created by a certain Discord user
   * @param id The Discord user ID
   * @returns The lobbies created by the user.
   */
  async getAllActiveByUser(id: string): Promise<Lobby[]> {
    return this.repository.find({
      createdBy: id,
      $or: LOBBY_ACTIVE_STATUS_CONDITION,
    });
  }

  /**
   * Get all lobbies
   */
  async getAll(): Promise<Lobby[]> {
    return this.repository.find({}).limit(50);
  }

  /**
   * Get all active lobbies
   */
  async getAllActive(): Promise<Lobby[]> {
    return this.repository.find({ $or: LOBBY_ACTIVE_STATUS_CONDITION });
  }

  /**
   * Gets active lobbies where the player is queued in.
   * @param id The Discord ID of the user we're searching for
   * @returns The Lobby(s) the user is queued in.
   */
  async getQueuedInLobby(id: string): Promise<Lobby[]> {
    return this.repository.find({
      queuedPlayers: { $elemMatch: { discord: id } },
      $or: LOBBY_ACTIVE_STATUS_CONDITION,
    });
  }

  /**
   * Create a request for new lobby
   *
   * @param client
   * @param options - Options for server
   */
  async createRequest(
    client: Client,
    options: LobbyRequestDto,
  ): Promise<Lobby> {
    if (!options.matchOptions.callbackUrl) {
      options.matchOptions.callbackUrl = options.callbackUrl;
    }

    // Do not allow creation if user already has created lobbies
    if ((await this.getAllActiveByUser(options.userId)).length > 0)
      throw new BadRequestException({
        error: true,
        message: `You've already created one lobby!`,
      });

    // Do not allow creation if user is already queued in a lobby
    if ((await this.getQueuedInLobby(options.userId)).length > 0)
      throw new BadRequestException({
        error: true,
        message: `You're already queued in a lobby! Unqueue to create a new one.`,
      });

    // Create the Match document with the match options
    const match = await this.matchService.createRequest(
      client,
      options.matchOptions,
    );

    this.logger.debug(`Creating lobby with options ${options}`);

    // Create the Lobby document
    const lobby = new this.repository({
      match: match._id,
      client: client.id,
      status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS,
      distribution: options.distribution,
      createdAt: new Date(),
      createdBy: options.userId,
      requirements: options.requirements,
      queuedPlayers: options.queuedPlayers || [],
      maxPlayers: options.matchOptions.requiredPlayers,
      callbackUrl: options.callbackUrl || '',
      data: {
        expiryTime: options.data.expiryTime || 1800,
      },
    });
    await lobby.save();

    return lobby;
  }

  /**
   * Initiates the closing process of a Lobby.
   * @param client The client that initiated the lobby close.
   * @param id The ID of the Lobby we're closing.
   * @returns The newly updated Lobby document.
   */
  async close(client: Client, id: string): Promise<Lobby> {
    // TODO: Verify client has access to close a lobby
    // Will do this once the closing logic is finished and start working on 1:1 restrictions
    //
    // Get the Lobby document we're closing.
    const lobby: Lobby = await this.repository.findOne({
      _id: id,
      $or: LOBBY_ACTIVE_STATUS_CONDITION,
    });

    // If the Lobby is already closed, return the Lobby.
    if (!lobby) return lobby;

    try {
      // Close the match as well
      const { status } = await this.matchService.close(lobby.match);

      if (status === MatchStatus.CLOSED) {
        // Begin closing the Lobby (this will also notify Regi-Cytokine)
        lobby.updateStatus(LobbyStatus.CLOSED);

        // Return the updated Lobby
        return lobby;
      }
    } catch (e) {
      this.logger.error(`Failed to close lobby '${id}': ${e}`);
    }
  }

  /**
   * Let player join a lobby
   *
   * @param client
   * @param id = Lobby ID
   * @param player - Player Request Object
   */
  async addPlayer(
    client: Client,
    id: string,
    player: PlayerJoinRequestDto,
  ): Promise<Lobby> {
    // TODO: Verify client has access to this lobby

    // If the user is already queued in another lobby do not allow them
    if ((await this.getQueuedInLobby(player.discord)).length > 0)
      throw new BadRequestException({
        error: true,
        message: `You're already queued in another lobby!`,
      });

    const lobby = await this.getById(id);

    if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
      throw new BadRequestException({
        error: true,
        message: 'Cannot join this lobby',
      });
    }

    lobby.queuedPlayers.push(player);
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }

  /**
   * Get player in lobby by ID
   *
   * @param client
   * @param id = Lobby ID
   * @param pid - Player ID
   * @param type - Type of player ID (steam or discord)
   */
  async getPlayer(
    client: Client,
    id: string,
    pid: string,
    type: 'discord' | 'steam' | 'name',
  ) {
    // TODO: Verify client has access to this lobby

    const lobby = await this.getById(id);
    return lobby.queuedPlayers.filter((player) =>
      type === 'discord'
        ? player.discord === pid
        : type === 'steam'
        ? player.steam === pid
        : player.name === pid,
    )[0];
  }

  /**
   * Remove player from lobby by ID
   *
   * @param client
   * @param id = Lobby ID
   * @param pid - Player ID
   * @param type - Type of player ID
   */
  async removePlayer(
    client: Client,
    id: string,
    pid: string,
    type: 'discord' | 'steam' | 'name',
  ) {
    // TODO: Verify client has access to this lobby

    const lobby = await this.getById(id);

    if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
      throw new BadRequestException({ message: 'Cannot leave this lobby' });
    }

    lobby.queuedPlayers = lobby.queuedPlayers.filter(
      (player) =>
        !(type === 'discord'
          ? player.discord === pid
          : type === 'steam'
          ? player.steam === pid
          : player.name === pid),
    );
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }

  /**
   * Add role to player in lobby
   *
   * @param client
   * @param id = Lobby ID
   * @param pid - Player ID
   * @param type - Type of player ID
   * @param role - Role to add
   */
  async addPlayerRole(
    client: Client,
    id: string,
    pid: string,
    type: 'discord' | 'steam' | 'name',
    role: string,
  ) {
    // TODO: Verify client has access to this lobby

    const lobby = await this.getById(id);

    if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
      throw new BadRequestException({
        message: 'Cannot add role for this player in this lobby',
      });
    }

    const index = lobby.queuedPlayers.findIndex((player) =>
      type === 'discord'
        ? player.discord === pid
        : type === 'steam'
        ? player.steam === pid
        : player.name === pid,
    );

    if (index === -1) {
      throw new NotFoundException('Player not found');
    }

    lobby.queuedPlayers[index].roles.push(role);
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }

  /**
   * Remove role from player in lobby
   *
   * @param client
   * @param id = Lobby ID
   * @param pid - Player ID
   * @param type - Type of player ID
   * @param role - Role to add
   */
  async removePlayerRole(
    client: Client,
    id: string,
    pid: string,
    type: 'discord' | 'steam' | 'name',
    role: string,
  ) {
    // TODO: Verify client has access to this lobby

    const lobby = await this.getById(id);

    if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
      throw new BadRequestException({
        message: 'Cannot add role for this player in this lobby',
      });
    }

    const index = lobby.queuedPlayers.findIndex((player) =>
      type === 'discord'
        ? player.discord === pid
        : type === 'steam'
        ? player.steam === pid
        : player.name === pid,
    );

    if (index === -1) {
      throw new NotFoundException('Player not found');
    }

    lobby.queuedPlayers[index].roles = lobby.queuedPlayers[index].roles.filter(
      (r) => r !== role,
    );
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }

  /**
   * Check if the lobby requirements are met
   *
   * @param lobby
   */
  async checkForRequiredPlayers(lobby: Lobby): Promise<boolean> {
    const players = lobby.queuedPlayers;
    const requirements = lobby.requirements;
    const count = {};

    players.forEach((item) => {
      item.roles.forEach((role) => {
        count[role] ? count[role]++ : (count[role] = 1);
      });
    });

    const unfilled = requirements.filter((item) =>
      count[item.name] ? count[item.name] < item.count : true,
    );
    const overfilled = requirements.filter(
      (item) => count[item.name] > item.count && !item.overfill,
    );

    this.logger.debug(
      `Match ${lobby._id} has ${unfilled.length} unfilled roles: [${unfilled
        .map((item) => item.name)
        .join(', ')}]`,
    );
    this.logger.debug(
      `Match ${lobby._id} has ${
        overfilled.length
      } overfilled roles: [${overfilled.map((item) => item.name).join(', ')}]`,
    );

    return unfilled.length === 0 && overfilled.length === 0;
  }

  /**
   * Check all matches for actions
   */
  async monitor(): Promise<void> {
    // Check if required players are present in waiting lobbies
    const waitingForPlayerLobbies = await this.repository.find({
      status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS,
    });

    this.logger.debug(
      `Found ${waitingForPlayerLobbies.length} lobbies that are waiting for players...`,
    );

    for (const lobby of waitingForPlayerLobbies) {
      setTimeout(async () => {
        await this.monitorLobby(lobby);
      }, 100);
    }
  }

  async monitorLobby(lobby: Lobby) {
    const createdAt = lobby.createdAt;
    createdAt.setSeconds(createdAt.getSeconds() + lobby.data.expiryTime);

    if (createdAt <= new Date()) {
      return this.handleExpiredLobby(lobby);
    }

    if (await this.checkForRequiredPlayers(lobby)) {
      await this.processLobby(lobby);
    }
  }

  /**
   * Process the lobby as there are enough players
   *
   * @param lobby
   */
  async processLobby(lobby: Lobby) {
    this.logger.log(`Lobby ${lobby._id} has enough players!`);
    this.logger.debug(lobby);

    await lobby.updateStatus(LobbyStatus.DISTRIBUTING);
    await this.distributorService.distribute(lobby);
    await lobby.updateStatus(LobbyStatus.DISTRIBUTED);

    this.logger.log(`Lobby ${lobby._id} has been distributed!`);
    this.logger.debug(lobby);

    const match = await this.matchService.getById(lobby.match);
    match.players = lobby.queuedPlayers;
    await match.save();
    await match.updateStatus(MatchStatus.LOBBY_READY);
  }

  /**
   * Handles a Lobby that has reached its expiry date.
   * @param lobby The lobby to handle
   * @noreturn
   */
  async handleExpiredLobby(lobby: Lobby): Promise<void> {
    const createdAt = lobby.createdAt;
    createdAt.setSeconds(createdAt.getSeconds() + lobby.data.expiryTime);
    this.logger.debug(
      `Lobby with ID '${lobby._id}' has expired ${
        (new Date().getTime() - createdAt.getTime()) / 1000
      } seconds ago`,
    );

    // Do the status update.
    await lobby.updateStatus(LobbyStatus.EXPIRED);

    // Close the match
    await this.matchService.close(lobby.match);
  }
}

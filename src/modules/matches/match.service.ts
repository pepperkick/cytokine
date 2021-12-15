import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Match } from './match.model';
import { Client } from '../clients/client.model';
import { MatchStatus } from './match-status.enum';
import { Game } from '../../objects/game.enum';
import { Player } from './match-player.interfaace';
import { MatchRequestDto } from './match-request.dto';
import { PlayerJoinRequestDto } from './player-join-request.dto';
import axios from 'axios';
import * as config from '../../../config.json';
import {
  Server,
  ServerRequestOptions,
  ServerStatus,
} from '../../objects/server.interface';

export const MATCH_ACTIVE_STATUS_CONDITION = [
  { status: MatchStatus.WAITING_FOR_LOBBY },
  { status: MatchStatus.LIVE },
];

export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(@InjectModel(Match.name) private repository: Model<Match>) {
    if (config.monitoring.enabled === true) {
      setInterval(async () => {
        // await this.monitor();
      }, config.monitoring.interval * 1000);
    }
  }

  /**
   * Get match by id
   *
   * @param id - Match ID
   */
  async getById(id: string): Promise<Match> {
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
   * Get match by id from specific client
   *
   * @param client - Client Object
   * @param id - Match ID
   */
  async getByIdForClient(client: Client, id: string): Promise<Match> {
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
   * Get all matches by client
   *
   * @param client
   */
  async getAllByClient(client: Client): Promise<Match[]> {
    return this.repository.find({ client: client.id }).limit(50);
  }

  /**
   * Get active matches
   *
   * @param client
   */
  async getAllActiveByClient(client: Client): Promise<Match[]> {
    return this.repository.find({
      client: client.id,
      $or: MATCH_ACTIVE_STATUS_CONDITION,
    });
  }

  /**
   * Get all matches
   */
  async getAll(): Promise<Match[]> {
    return this.repository.find({}).limit(50);
  }

  /**
   * Get all active matches
   */
  async getAllActive(): Promise<Match[]> {
    return this.repository.find({ $or: MATCH_ACTIVE_STATUS_CONDITION });
  }

  /**
   * Create a request for new match
   *
   * @param client
   * @param options - Options for server
   */
  async createRequest(
    client: Client,
    options: MatchRequestDto,
  ): Promise<Match> {
    const { game, region, callbackUrl } = options;

    this.logger.log(
      `Received new match request from client '${client.id}' at region '${region}' for game '${game}'`,
    );

    // Check if the client has access to the game
    if (!client.hasGameAccess(game))
      throw new ForbiddenException(
        `Client does not have access to '${game}' game.`,
      );

    // Check if client has access to the region
    if (!client.hasRegionAccess(region))
      throw new ForbiddenException(
        `Client does not have access to '${region}' region.`,
      );

    // Fetch all matches inuse by the client
    const clientMatches = await this.repository.find({
      client: client.id,
      $or: MATCH_ACTIVE_STATUS_CONDITION,
    });

    // Check if client has not reached limit
    if (clientMatches.length >= client.getLimit())
      throw new HttpException(
        `Cannot create new server as client has reached the limit.`,
        429,
      );

    const match = new this.repository({
      createdAt: new Date(),
      client: client.id,
      callbackUrl,
      region,
      game,
      status: MatchStatus.WAITING_FOR_LOBBY,
      players: options.players || [],
      requiredPlayers: options.requiredPlayers,
      preferences: {
        createLighthouseServer: true,
      },
    });
    await match.save();

    return match;
  }

  /**
   * Let player join a match
   *
   * @param client
   * @param id = Match ID
   * @param player - Player Object
   */
  async playerJoin(
    client: Client,
    id: string,
    player: PlayerJoinRequestDto,
  ): Promise<Match> {
    const match = await this.getById(id);

    if (match.status != MatchStatus.WAITING_FOR_LOBBY) {
      throw new BadRequestException({ message: 'Cannot join this match' });
    }

    match.players.push(player);
    await match.save();
    return match;
  }

  /**
   * Update the status of a match and notify the callback url if it is present
   *
   * @param match
   * @param status
   * @param data
   */
  async updateStatusAndNotify(
    match: Match,
    status: MatchStatus,
    data: any = {},
  ): Promise<void> {
    if (match.status === status) return;

    match.status = status;

    if (match.callbackUrl) {
      this.logger.log(
        `Notifying URL '${match.callbackUrl}' for status '${match.status} (${match._id})'`,
      );

      try {
        await axios.post(`${match.callbackUrl}?status=${match.status}`, {
          ...match.toJSON(),
          ...data,
        });
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.warn(
            `Failed to connect callback URL "${match.callbackUrl}"`,
          );
        } else {
          this.logger.error('Failed to notify callback URL', error);
        }
      }
    }

    await match.save();
  }

  /**
   * Create lighthouse server for the match
   *
   * @param match
   */
  async createServerForMatch(match: Match) {
    await this.updateStatusAndNotify(match, MatchStatus.CREATING_SERVER);

    const providers = await MatchService.getAvailableRegionProvider(
      match.region,
    );
    if (providers.length === 0) {
      await this.updateStatusAndNotify(match, MatchStatus.FAILED);
      throw new Error(
        `Cannot create server for match ${match._id} as there are no available provider in region ${match.region}`,
      );
    }

    const options: ServerRequestOptions = {
      game: match.game,
      region: match.region,
      provider: providers[0],
      closePref: {},
    };

    try {
      const server = await MatchService.sendServerCreateRequest(options);
      match.server = server._id;
      await match.save();
    } catch (error) {
      this.logger.error('Failed to create server', error);
      await this.updateStatusAndNotify(match, MatchStatus.FAILED);
    }
  }

  /**
   * Handle server status changes
   *
   * @param server
   * @param status
   */
  async handleServerStatusChange(server: Server, status: ServerStatus) {
    this.logger.log(
      `Received server (${server._id}) status (${status}) update callback.`,
    );

    const match = await this.repository.findOne({ server: server._id });

    if (!match) throw new NotFoundException();

    if (match.status === MatchStatus.CREATING_SERVER) {
      if (status === ServerStatus.IDLE || status === ServerStatus.RUNNING) {
        await this.updateStatusAndNotify(match, MatchStatus.WAITING);
      } else if (status === ServerStatus.FAILED) {
        await this.updateStatusAndNotify(match, MatchStatus.FAILED);
      }
    }
  }

  /**
   * Get available server provider for the region in lighthouse
   */
  static async getAvailableRegionProvider(region: string): Promise<string[]> {
    const res = await axios.get(
      `${config.lighthouse.host}/api/v1/providers/region/${region}`,
      {
        headers: {
          Authorization: `Bearer ${config.lighthouse.clientSecret}`,
        },
      },
    );
    return res.data;
  }

  /**
   * Send a server creation request to lighthouse
   */
  static async sendServerCreateRequest(
    options: ServerRequestOptions,
  ): Promise<any> {
    options.callbackUrl = `${config.localhost}/api/v1/matches/server/callback`;
    const res = await axios.post(
      `${config.lighthouse.host}/api/v1/servers`,
      options,
      {
        headers: {
          Authorization: `Bearer ${config.lighthouse.clientSecret}`,
        },
      },
    );
    return res.data;
  }
}

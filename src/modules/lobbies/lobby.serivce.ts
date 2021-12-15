import { BadRequestException, ForbiddenException, HttpException, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Match } from "../matches/match.model";
import { Model } from "mongoose";
import * as config from "../../../config.json";
import { Lobby } from "./lobby.model";
import { Client } from "../clients/client.model";
import { MatchService } from "../matches/match.service";
import { LobbyRequestDto } from "./lobby-request.dto";
import { PlayerJoinRequestDto } from "./player-join-request.dto";
import { LobbyStatus } from "./lobby-status.enum";

export const LOBBY_ACTIVE_STATUS_CONDITION = [
	{ status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS },
	{ status: LobbyStatus.DISTRIBUTING }
]

export class LobbyService {
	private readonly logger = new Logger(LobbyService.name);

	constructor(
		@InjectModel(Lobby.name) private repository: Model<Lobby>,
		private matchService: MatchService
	) {
		if (config.monitoring.enabled === true) {
			setInterval(async () => {
				await this.monitor();
			}, config.monitoring.interval * 1000)
		}
	}

	/**
	 * Get lobby by id
	 *
	 * @param id - Match ID
	 */
	async getById(id: string): Promise<Lobby> {
		let object;

		try {
			object = await this.repository.findById(id);
		} catch (exception) {
			throw new NotFoundException();
		}

		if (!object)
			throw new NotFoundException();

		return object;
	}

	/**
	 * Get lobby by id from specific client
	 *
	 * @param client - Client Object
	 * @param id - Match ID
	 */
	async getByIdForClient(client: Client, id: string): Promise<Lobby> {
		let object;

		try {
			object = await this.repository.findById(id);
		} catch (exception) {
			throw new NotFoundException();
		}

		if (!object)
			throw new NotFoundException();

		if (client.id !== object.client)
			throw new NotFoundException();

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
	 * Get active lobbies
	 *
	 * @param client
	 */
	async getAllActiveByClient(client: Client): Promise<Lobby[]> {
		return this.repository.find({ client: client.id, $or: LOBBY_ACTIVE_STATUS_CONDITION });
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
	 * Create a request for new lobby
	 *
	 * @param client
	 * @param options - Options for server
	 */
	async createRequest(client: Client, options: LobbyRequestDto): Promise<Lobby> {
		if (!options.matchOptions.callbackUrl) {
			options.matchOptions.callbackUrl = options.callbackUrl;
		}

		const match = await this.matchService.createRequest(client, options.matchOptions)
		const lobby = new this.repository({
			match: match._id,
			status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS,
			distribution: options.distribution,
			createdAt: new Date(),
			requirements: options.requirements,
			queuedPlayers: options.queuedPlayers || [],
			callbackUrl: options.callbackUrl || ""
		});
		await lobby.save()

		return lobby
	}

	/**
	 * Let player join a lobby
	 *
	 * @param client
	 * @param id = Match ID
	 * @param player - Player Request Object
	 */
	async playerJoin(client: Client, id: string, player: PlayerJoinRequestDto): Promise<Lobby> {
		const lobby = await this.getById(id)

		if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
			throw new BadRequestException({ message: "Cannot join this lobby" })
		}

		lobby.queuedPlayers.push(player)
		lobby.markModified("queuedPlayers")
		await lobby.save()
		return lobby
	}

	/**
	 * Check if the lobby requirements are met
	 *
	 * @param lobby
	 */
	async checkForRequiredPlayers(lobby: Lobby): Promise<boolean> {
		const players = lobby.queuedPlayers
		const requirements = lobby.requirements
		const count = {}

		players.forEach(item => {
			item.roles.forEach(role => {
				count[role] ? count[role]++ : count[role] = 1
			})
		})

		const unfilled = requirements.filter(item => count[item.name] < item.count)
		const overfilled = requirements.filter(item => count[item.name] > item.count && !item.overfill)

		this.logger.debug(`Match ${lobby._id} has ${unfilled.length} unfilled roles: [${unfilled.map(item => item.name).join(", ")}]`);
		this.logger.debug(`Match ${lobby._id} has ${overfilled.length} overfilled roles: [${overfilled.map(item => item.name).join(", ")}]`);

		return unfilled.length === 0 && overfilled.length === 0
	}

	/**
	 * Check all matches for actions
	 */
	async monitor(): Promise<void> {
		// Check if required players are present in waiting lobbies
		const waitingForPlayerLobbies = await this.repository.find({
			status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS
		});

		this.logger.debug(`Found ${waitingForPlayerLobbies.length} matches that are waiting for players...`)

		for (const lobby of waitingForPlayerLobbies) {
			setTimeout(async () => {
				await this.monitorLobby(lobby)
			}, 100);
		}
	}

	async monitorLobby(lobby: Lobby) {
		if (await this.checkForRequiredPlayers(lobby)) {
			this.logger.log(`Lobby ${lobby._id} has enough players!`)
			this.logger.debug(lobby)
			// TODO: Next step after players have joined
		}
	}
}
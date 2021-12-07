import { BadRequestException, ForbiddenException, HttpException, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Match } from "../matches/match.model";
import { Model } from "mongoose";
import * as config from "../../../config.json";
import { Lobby } from "./lobby.model";
import { Client } from "../clients/client.model";
import { MatchService } from "../matches/match.service";
import { LobbyRequestDto } from "./lobby-request.dto";
import { PlayerJoinRequestDto } from "../matches/player-join-request.dto";
import { LobbyStatus } from "./lobby-status.enum";

export const LOBBY_ACTIVE_STATUS_CONDITION = [
	{ status: LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS },
	{ status: LobbyStatus.LIVE }
]

export class LobbyService {
	private readonly logger = new Logger(LobbyService.name);

	constructor(
		@InjectModel(Lobby.name) private repository: Model<Lobby>,
		private matchService: MatchService
	) { }

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
		const match = await this.matchService.createRequest(client, options)

		const lobby = new this.repository({
			match: match._id,
			type: options.type,
		});
		lobby.createdAt = new Date()
		lobby.requirements = options.requirements
		lobby.queuedPlayers = options.players || []
		await lobby.save()

		return lobby
	}

	/**
	 * Let player join a lobby
	 *
	 * @param client
	 * @param id = Match ID
	 * @param player - Player Object
	 */
	async playerJoin(client: Client, id: string, player: PlayerJoinRequestDto): Promise<Lobby> {
		const lobby = await this.getById(id)

		if (lobby.status != LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) {
			throw new BadRequestException({ message: "Cannot join this lobby" })
		}

		lobby.queuedPlayers.push(player)
		await lobby.save()
		return lobby
	}
}
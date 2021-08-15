import { BadRequestException, ForbiddenException, HttpException, Logger, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Match } from "./match.model";
import { Client } from "../clients/client.model";
import { MatchStatus } from "../../objects/match-status.enum";
import { Game } from "../../objects/game.enum";
import { Player } from "../../objects/player.interfaace";
import { MatchRequestDto } from "./match-request.dto";
import { PlayerJoinRequestDto } from "./player-join-request.dto";

export interface MatchRequestOptions {
	// Game to use for the match
	game: Game

	// Region of the match and server
	region: string

	// URL to send a POST request when status of the request changes
	callbackUrl: string

	// List of players
	players: Player[]

	// Number of players required in this match
	requiredPlayers: number
}

export const MATCH_ACTIVE_STATUS_CONDITION = [
	{ status: MatchStatus.WAITING_FOR_MINIMUM_PLAYERS },
	{ status: MatchStatus.LIVE }
]

export class MatchesService {
	private readonly logger = new Logger(MatchesService.name);

	constructor(
		@InjectModel(Match.name) private repository: Model<Match>,
	) {}

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

		if (!object)
			throw new NotFoundException();

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

		if (!object)
			throw new NotFoundException();

		if (client.id !== object.client)
			throw new NotFoundException();

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
		return this.repository.find({ client: client.id, $or: MATCH_ACTIVE_STATUS_CONDITION });
	}

	/**
	 * Get all matches
	 */
	async getAll(): Promise<Match[]> {
		return this.repository.find({}).limit(50);
	}

	/**
	 * Get all active matchers
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
	async createRequest(client: Client, options: MatchRequestDto): Promise<Match> {
		const { game, region, callbackUrl } = options;

		this.logger.log(`Received new match request from client '${client.id}' at region '${region}' for game '${game}'`);

		// Check if the client has access to the game
		if (!client.hasGameAccess(game))
			throw new ForbiddenException(`Client does not have access to '${game}' game.`)

		// Check if client has access to the region
		if (!client.hasRegionAccess(region))
			throw new ForbiddenException(`Client does not have access to '${region}' region.`)

		// Fetch all matches inuse by the client
		const clientMatches = await this.repository.find(
			{ client: client.id, $or: MATCH_ACTIVE_STATUS_CONDITION })

		// Check if client has not reached limit
		if (clientMatches.length >= client.getLimit())
			throw new HttpException(
				`Cannot create new server as client has reached the limit.`, 429);

		const match = new this.repository({
			client: client.id,
			callbackUrl, region, game
		});
		match.createdAt = new Date();
		match.status = MatchStatus.WAITING_FOR_MINIMUM_PLAYERS;
		match.players = options.players || []
		match.preferences = {
			requiredPlayers: options.requiredPlayers
		}
		await match.save()

		return match;
	}


	/**
	 * Let player join a match
	 *
	 * @param client
	 * @param id = Match ID
	 * @param player - Player Object
	 */
	async playerJoin(client: Client, id: string, player: PlayerJoinRequestDto): Promise<Match> {
		const match = await this.getById(id)
		match.players.push(player)
		await match.save()
		return match
	}
}
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
	UsePipes,
	ValidationPipe
} from "@nestjs/common";
import { MatchesService, MatchRequestOptions } from "../../matches/matches.service";
import { Match } from "../../matches/match.model";
import { ClientGuard } from "./client.guard";
import { RequestWithClient } from "../request-with-client.interface";
import { Player } from "../../../objects/player.interfaace";
import { MatchRequestDto } from "../../matches/match-request.dto";
import { PlayerJoinRequestDto } from "../../matches/player-join-request.dto";

interface PlayerJoinRequest extends RequestWithClient {
	player: Player
}

@Controller("/api/v1/matches")
export class MatchesController {
	constructor(private readonly service: MatchesService) {}

	/**
	 * Get list of servers by client
	 */
	@Get("/")
	@UseGuards(ClientGuard)
	async getServersByClient(@Req() request: RequestWithClient, @Query("all") all: boolean): Promise<{ matches: Match[] }> {
		if (all)
			return { matches: await this.service.getAllByClient(request.client) };

		return { matches: await this.service.getAllActiveByClient(request.client) };
	}

	/**
	 * Create a request for new match
	 */
	@Post("/")
	@UseGuards(ClientGuard)
	@UsePipes(new ValidationPipe())
	async create(@Body() body: MatchRequestDto, @Req() request: RequestWithClient): Promise<Match> {
		return this.service.createRequest(request.client, body);
	}

	/**
	 * Get match info by id
	 */
	@Get("/:id")
	@UseGuards(ClientGuard)
	async getById(@Req() request: RequestWithClient, @Param("id") id: string): Promise<Match> {
		return this.service.getByIdForClient(request.client, id);
	}

	/**
	 * Create a close request for match
	 */
	@Delete("/:id")
	@UseGuards(ClientGuard)
	async delete(@Req() request: RequestWithClient, @Param("id") id: string): Promise<void> {
		// TODO: Close match
	}

	/**
	 * Let player join a match
	 */
	@Post("/:id/join")
	@UseGuards(ClientGuard)
	@UsePipes(new ValidationPipe())
	async playerJointMatch(@Body() body: PlayerJoinRequestDto, @Req() request: RequestWithClient, @Param("id") id: string): Promise<Match> {
		return this.service.playerJoin(request.client, id, body);
	}
}
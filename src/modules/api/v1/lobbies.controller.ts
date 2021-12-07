import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { MatchesController } from "./matches.controller";
import { MatchService } from "../../matches/match.service";
import { LobbyService } from "../../lobbies/lobby.serivce";
import { ClientGuard } from "./client.guard";
import { RequestWithClient } from "../request-with-client.interface";
import { Match } from "../../matches/match.model";
import { Lobby } from "../../lobbies/lobby.model";
import { MatchRequestDto } from "../../matches/match-request.dto";
import { LobbyRequestDto } from "../../lobbies/lobby-request.dto";
import { PlayerJoinRequestDto } from "../../matches/player-join-request.dto";

@Controller("/api/v1/lobbies")
export class LobbiesController {
	constructor(private readonly service: LobbyService) {}

	/**
	 * Get list of matches by client
	 */
	@Get("/")
	@UseGuards(ClientGuard)
	async getServersByClient(@Req() request: RequestWithClient, @Query("all") all: boolean): Promise<{ lobbies: Lobby[] }> {
		if (all)
			return { lobbies: await this.service.getAllByClient(request.client) };

		return { lobbies: await this.service.getAllActiveByClient(request.client) };
	}

	/**
	 * Create a request for new lobby
	 */
	@Post("/")
	@UseGuards(ClientGuard)
	@UsePipes(new ValidationPipe())
	async create(@Body() body: LobbyRequestDto, @Req() request: RequestWithClient): Promise<Lobby> {
		return this.service.createRequest(request.client, body);
	}

	/**
	 * Get match info by id
	 */
	@Get("/:id")
	@UseGuards(ClientGuard)
	async getById(@Req() request: RequestWithClient, @Param("id") id: string): Promise<Lobby> {
		return this.service.getByIdForClient(request.client, id);
	}

	/**
	 * Let player join a match
	 */
	@Post("/:id/join")
	@UseGuards(ClientGuard)
	@UsePipes(new ValidationPipe())
	async playerJointMatch(@Body() body: PlayerJoinRequestDto, @Req() request: RequestWithClient, @Param("id") id: string): Promise<Lobby> {
		return this.service.playerJoin(request.client, id, body);
	}
}
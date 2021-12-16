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
  ValidationPipe,
} from '@nestjs/common';
import { LobbyService } from '../../lobbies/lobby.serivce';
import { ClientGuard } from './client.guard';
import { RequestWithClient } from '../request-with-client.interface';
import { Lobby } from '../../lobbies/lobby.model';
import { LobbyRequestDto } from '../../lobbies/lobby-request.dto';
import { PlayerJoinRequestDto } from '../../lobbies/player-join-request.dto';
import { Player } from '../../lobbies/lobby-player.interface';

@Controller('/api/v1/lobbies')
export class LobbiesController {
  constructor(private readonly service: LobbyService) {}

  /**
   * Get list of lobbies by client
   */
  @Get('/')
  @UseGuards(ClientGuard)
  async getServersByClient(
    @Req() request: RequestWithClient,
    @Query('all') all: boolean,
  ): Promise<{ lobbies: Lobby[] }> {
    if (all)
      return { lobbies: await this.service.getAllByClient(request.client) };

    return { lobbies: await this.service.getAllActiveByClient(request.client) };
  }

  /**
   * Create a request for new lobby
   */
  @Post('/')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() body: LobbyRequestDto,
    @Req() request: RequestWithClient,
  ): Promise<Lobby> {
    return this.service.createRequest(request.client, body);
  }

  /**
   * Get lobby info by id
   */
  @Get('/:id')
  @UseGuards(ClientGuard)
  async getById(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
  ): Promise<Lobby> {
    return this.service.getByIdForClient(request.client, id);
  }

  /**
   * Add a player to the lobby
   */
  @Post('/:id/join')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe())
  async addPlayer(
    @Body() body: PlayerJoinRequestDto,
    @Req() request: RequestWithClient,
    @Param('id') id: string,
  ): Promise<Lobby> {
    return this.service.addPlayer(request.client, id, body);
  }

  /**
   * Get a player from the lobby by type
   */
  @Get('/:id/players/:type/:pid')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe())
  async getPlayer(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Param('type') type: 'discord' | 'steam' | 'name',
  ): Promise<Player> {
    return this.service.getPlayer(request.client, id, pid, type);
  }

  /**
   * Add a role to the player in the lobby
   */
  @Post('/:id/players/:type/:pid/roles/:role')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe())
  async addPlayerRole(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Param('type') type: 'discord' | 'steam' | 'name',
    @Param('role') role: string,
  ): Promise<Lobby> {
    return this.service.addPlayerRole(request.client, id, pid, type, role);
  }

  /**
   * Remove a role from the player in the lobby
   */
  @Delete('/:id/players/:type/:pid/roles/:role')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe())
  async removePlayerRole(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Param('type') type: 'discord' | 'steam' | 'name',
    @Param('role') role: string,
  ): Promise<Lobby> {
    return this.service.removePlayerRole(request.client, id, pid, type, role);
  }

  /**
   * Remove a player from the lobby by type
   */
  @Delete('/:id/players/:type/:pid')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe())
  async removePlayer(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Param('type') type: 'discord' | 'steam' | 'name',
  ): Promise<Lobby> {
    return this.service.removePlayer(request.client, id, pid, type);
  }
}

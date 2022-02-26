import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { LobbyService } from '../../lobbies/lobby.service';
import { ClientGuard } from './client.guard';
import { RequestWithClient } from '../request-with-client.interface';
import { Lobby } from '../../lobbies/lobby.model';
import { LobbyRequestDto } from '../../lobbies/lobby-request.dto';
import { PlayerJoinRequestDto } from '../../lobbies/player-join-request.dto';
import { Player } from '../../lobbies/lobby-player.interface';
import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';

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
   * Creates a request to close a lobby
   */
  @Delete('/:id')
  @UseGuards(ClientGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async close(
    @Req() request: RequestWithClient,
    @Param('id') id: string,
  ): Promise<Lobby> {
    return this.service.close(request.client, id);
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
   * Get lobby info by match id
   */
  @Get('/match/:id')
  @UseGuards(ClientGuard)
  async getByMatchId(
    @Req() request: RequestWithClient,
    @Param('id') matchId: string,
  ): Promise<Lobby> {
    const lobby = await this.service.getByMatchId(matchId);

    if (lobby.client !== request.client.id) {
      throw new NotFoundException();
    }

    return lobby;
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
    @Param('role') role: LobbyPlayerRole,
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

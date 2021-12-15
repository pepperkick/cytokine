import { Module } from '@nestjs/common';
import { MatchModule } from '../../matches/match.module';
import { MatchesController } from './matches.controller';
import { ClientsModule } from '../../clients/clients.module';
import { LobbiesController } from './lobbies.controller';
import { LobbyModule } from '../../lobbies/lobby.module';

@Module({
  imports: [MatchModule, ClientsModule, LobbyModule],
  controllers: [MatchesController, LobbiesController],
})
export class V1Module {}

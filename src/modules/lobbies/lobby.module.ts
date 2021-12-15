import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lobby, LobbySchema } from './lobby.model';
import { LobbyService } from './lobby.serivce';
import { MatchModule } from '../matches/match.module';

@Module({
  imports: [
    MatchModule,
    MongooseModule.forFeature([{ name: Lobby.name, schema: LobbySchema }]),
  ],
  providers: [LobbyService],
  exports: [LobbyService],
})
export class LobbyModule {}

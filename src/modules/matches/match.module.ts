import { forwardRef, Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from './match.model';
import { LobbyModule } from '../lobbies/lobby.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
    forwardRef(() => LobbyModule),
  ],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}

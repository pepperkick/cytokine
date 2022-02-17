import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lobby, LobbySchema } from './lobby.model';
import { LobbyService } from './lobby.service';
import { MatchModule } from '../matches/match.module';
import { DistributorModule } from '../distributor/distributor.module';

@Module({
  imports: [
    forwardRef(() => MatchModule),
    DistributorModule,
    MongooseModule.forFeature([{ name: Lobby.name, schema: LobbySchema }]),
  ],
  providers: [LobbyService],
  exports: [LobbyService],
})
export class LobbyModule {}

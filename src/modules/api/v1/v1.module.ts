import { Module } from "@nestjs/common";
import { MatchesModule } from "../../matches/matches.module";
import { MatchesController } from "./matches.controller";
import { ClientsModule } from "../../clients/clients.module";

@Module({
  imports: [ MatchesModule, ClientsModule ],
  controllers: [ MatchesController ]
})
export class V1Module {}
import { Module } from '@nestjs/common';
import { MatchesService } from "./matches.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Match, MatchSchema } from "./match.model";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Match.name, schema: MatchSchema }
		])
	],
	providers: [ MatchesService ],
	exports: [ MatchesService ]
})
export class MatchesModule {}
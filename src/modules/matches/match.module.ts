import { Module } from '@nestjs/common';
import { MatchService } from "./match.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Match, MatchSchema } from "./match.model";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Match.name, schema: MatchSchema }
		])
	],
	providers: [ MatchService ],
	exports: [ MatchService ]
})
export class MatchModule {}
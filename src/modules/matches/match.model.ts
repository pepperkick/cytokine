import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import { Game } from "../../objects/game.enum";
import { Player } from "./match-player.interfaace";
import { MatchStatus } from "./match-status.enum";

@Schema()
export class Match extends Document {
	@Prop({ type: Date })
	createdAt: Date

	@Prop({ type: String })
	status: MatchStatus

	@Prop({ type: String, required: true })
	client: string

	@Prop({ type: String, required: true })
	game: Game

	@Prop()
	callbackUrl: string

	@Prop()
	region: string

	@Prop()
	server: string

	@Prop()
	players: Player[]

	@Prop({ type: Object })
	preferences: {
		requiredPlayers: number
		createLighthouseServer?: boolean
	}
}

export const MatchSchema = SchemaFactory.createForClass(Match);
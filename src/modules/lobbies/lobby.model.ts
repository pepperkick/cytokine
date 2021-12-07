import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Player } from "../matches/match-player.interfaace";
import { RoleRequirement } from "../../objects/role.interface";
import { Document } from "mongoose";
import { LobbyType } from "../../objects/lobby-type.enum";
import { LobbyStatus } from "./lobby-status.enum";

@Schema()
export class Lobby extends Document {
	@Prop({ type: Date })
	createdAt: Date

	@Prop()
	match: string

	@Prop({ type: String })
	status: LobbyStatus

	@Prop({ type: String })
	type: LobbyType

	@Prop({ type: Object })
	queuedPlayers: Player[]

	@Prop({ type: Object })
	requirements: RoleRequirement[]
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);
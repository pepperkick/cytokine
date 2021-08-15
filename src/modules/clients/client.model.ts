import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

interface RegionAccess {
	limit: number
}

@Schema()
export class Client extends Document {
	@Prop({ type: String })
	id: string

	@Prop({ type: String })
	secret: string

	@Prop({ type: String })
	name: string

	@Prop({ type: Object })
	access: {
		games: string[],
		limit: number,
		regions: { [key: string]: RegionAccess }
	}

	hasGameAccess: (string) => boolean
	hasRegionAccess: (string) => boolean
	getRegionLimit: (string) => number
	getLimit: () => number
}

export const ClientSchema = SchemaFactory.createForClass(Client);

ClientSchema.methods.hasGameAccess = function (game: string): boolean {
	return this.access.games.includes(game);
}

ClientSchema.methods.hasRegionAccess = function (region: string): boolean {
	return this.access.regions.hasOwnProperty(region);
}

ClientSchema.methods.getRegionLimit = function (region: string): number {
	return this.access.regions[region]?.limit
}

ClientSchema.methods.getLimit = function (): number {
	return this.access.limit
}

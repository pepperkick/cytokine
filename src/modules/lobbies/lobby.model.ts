import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Player } from '../matches/match-player.interfaace';
import { RoleRequirement } from '../../objects/role.interface';
import { Document } from 'mongoose';
import { DistributionType } from '../../objects/distribution.enum';
import { LobbyStatus } from './lobby-status.enum';
import { IsOptional } from 'class-validator';

@Schema()
export class Lobby extends Document {
  @Prop({ type: Date })
  createdAt: Date;

  @Prop()
  match: string;

  @Prop()
  callbackUrl: string;

  @Prop({ type: String })
  status: LobbyStatus;

  @Prop({ type: String })
  distribution: DistributionType;

  @Prop({ type: Object })
  queuedPlayers: Player[];

  @Prop({ type: Object })
  requirements: RoleRequirement[];

  @Prop({ type: Object })
  data: {};
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);

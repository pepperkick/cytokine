import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Player } from '../matches/match-player.interfaace';
import { RoleRequirement } from '../../objects/role.interface';
import { Document } from 'mongoose';
import { DistributionType } from '../../objects/distribution.enum';
import { LobbyStatus } from './lobby-status.enum';
import { IsOptional } from 'class-validator';
import { stat } from 'fs';
import axios from 'axios';
import { Logger } from '@nestjs/common';

@Schema()
export class Lobby extends Document {
  @Prop({ type: Date })
  createdAt: Date;

  @Prop()
  name: string;

  @Prop()
  match: string;

  @Prop({ type: String, required: true })
  client: string;

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

  @Prop({ type: Number })
  maxPlayers: number;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: Object })
  data: {};

  updateStatus: (status: LobbyStatus, data?: any) => void;
  notify: (data?: any) => void;
}

export const LobbySchema = SchemaFactory.createForClass(Lobby);

const logger = new Logger(Lobby.name);

LobbySchema.methods.updateStatus = async function (
  status: LobbyStatus,
  data: any = {},
) {
  this.status = status;
  await this.save();
  await this.notify({
    ...this.toJSON(),
    ...data,
  });
};

LobbySchema.methods.notify = async function (data) {
  if (this.callbackUrl) {
    logger.log(
      `Notifying URL '${this.callbackUrl}' for status '${this.status} (${this._id})'`,
    );

    try {
      await axios.post(`${this.callbackUrl}?status=${this.status}`, data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn(`Failed to connect callback URL "${this.callbackUrl}"`);
      } else {
        logger.error('Failed to notify callback URL', error);
      }
    }
  }
};

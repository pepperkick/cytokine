import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Game } from '../../objects/game.enum';
import { Player } from './match-player.interfaace';
import { MatchStatus } from './match-status.enum';
import { Logger } from '@nestjs/common';
import { LobbyStatus } from '../lobbies/lobby-status.enum';
import axios from 'axios';
import { Lobby, LobbySchema } from '../lobbies/lobby.model';

@Schema()
export class Match extends Document {
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: String })
  status: MatchStatus;

  @Prop({ type: String, required: true })
  client: string;

  @Prop({ type: String, required: true })
  game: Game;

  @Prop({ type: String, required: true })
  map: string;

  @Prop()
  callbackUrl: string;

  @Prop()
  region: string;

  @Prop()
  server: string;

  @Prop()
  players: Player[];

  @Prop({ type: Object })
  format: unknown;

  @Prop({ type: Object })
  preferences: {
    requiredPlayers?: number;
    createLighthouseServer?: boolean;
    lighthouseProvider?: string;
    valveSdr?: boolean;
    gameConfig?: string;
  };

  @Prop({ type: Object })
  data: {
    logstfUrl?: string;
    demostfUrl?: string;
    teamScore?: any;
  };

  updateStatus: (status: MatchStatus, data?: any) => void;
  notify: (data?: any) => void;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

const logger = new Logger(Match.name);

MatchSchema.methods.updateStatus = async function (
  status: MatchStatus,
  data: any = {},
) {
  this.status = status;
  await this.save();
  await this.notify({
    ...this.toJSON(),
    ...data,
  });
};

MatchSchema.methods.notify = async function (data) {
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

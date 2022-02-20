import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Game } from '../../objects/game.enum';
import { Player } from './match-player.interfaace';

export class MatchRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(Game)
  game: Game;

  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsNotEmpty()
  map: string;

  @IsOptional()
  callbackUrl?: string;

  @IsArray()
  @IsOptional()
  players?: Player[];

  @IsNumber()
  @IsOptional()
  @Min(2)
  @Max(20)
  requiredPlayers?: number;

  @IsObject()
  @IsOptional()
  format?: unknown;

  @IsObject()
  @IsOptional()
  preference?: {
    createLighthouseServer?: boolean;
    lighthouseProvider?: string;
    gameConfig?: string;
    valveSdr?: boolean;
  };
}

import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { LobbyPlayerRole } from './lobby-player-role.enum';

export class PlayerJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  discord: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  steam: string;

  @IsArray()
  @IsNotEmpty()
  roles: LobbyPlayerRole[];

  @IsBoolean()
  @IsOptional()
  afk: boolean;
}

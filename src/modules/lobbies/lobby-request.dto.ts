import { MatchRequestDto } from '../matches/match-request.dto';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DistributionType } from '../../objects/distribution.enum';
import { Player } from '../matches/match-player.interfaace';
import { RoleRequirement } from '../../objects/role.interface';
import { Game } from '../../objects/game.enum';
import { Type } from 'class-transformer';

export class LobbyRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(DistributionType)
  distribution: DistributionType;

  @IsArray()
  @IsOptional()
  queuedPlayers: Player[];

  @IsArray()
  @IsOptional()
  requirements: RoleRequirement[];

  @ValidateNested()
  @Type(() => MatchRequestDto)
  matchOptions: MatchRequestDto;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  callbackUrl: string;
}

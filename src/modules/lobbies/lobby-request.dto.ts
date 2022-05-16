import { MatchRequestDto } from '../matches/match-request.dto';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DistributionType } from '../../objects/distribution.enum';
import { Player } from '../matches/match-player.interface';
import { RoleRequirement } from '../../objects/role.interface';
import { Type } from 'class-transformer';

export class LobbyDataDto {
  @IsOptional()
  expiryTime: number;

  @IsOptional()
  captainTimeout: number;
}

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

  @ValidateNested()
  @Type(() => LobbyDataDto)
  data: LobbyDataDto;
}

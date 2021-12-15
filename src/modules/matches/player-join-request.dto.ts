import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PlayerJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  team: number;

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
  roles: string[];
}

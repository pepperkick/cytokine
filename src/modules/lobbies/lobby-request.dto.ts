import { MatchRequestDto } from "../matches/match-request.dto";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { LobbyType } from "../../objects/lobby-type.enum";
import { Player } from "../matches/match-player.interfaace";
import { RoleRequirement } from "../../objects/role.interface";

export class LobbyRequestDto extends MatchRequestDto {
	@IsString()
	@IsNotEmpty()
	@IsEnum(LobbyType)
	type: LobbyType

	@IsArray()
	@IsOptional()
	queuedPlayers: Player[]

	@IsArray()
	@IsOptional()
	requirements: RoleRequirement[]
}
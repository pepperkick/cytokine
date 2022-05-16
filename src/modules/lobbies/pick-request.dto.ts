import { IsObject, IsString, IsNotEmpty } from 'class-validator';
import { LobbyPlayerRole } from './lobby-player-role.enum';

export class PickRequestDto {
  // Picked player information
  @IsObject()
  pick: {
    // Discord ID of the user that got picked.
    player: string;

    // Role the player got picked as.
    role: LobbyPlayerRole;
  };

  // Captain who performed the pick.
  @IsString()
  @IsNotEmpty()
  captain: string;
}

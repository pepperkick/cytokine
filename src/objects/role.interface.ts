import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';

export interface RoleRequirement {
  // Name of the role
  name: LobbyPlayerRole;

  // Required number of players in this role
  count: number;

  // Can number of player go above the required count
  overfill?: boolean;
}

import { LobbyPlayerRole } from './lobby-player-role.enum';

export class Player {
  name: string;
  discord?: string;
  steam?: string;
  roles?: LobbyPlayerRole[];
}

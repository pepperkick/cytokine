import { DistributionHandler } from '../handler.class';
import { Lobby } from '../../lobbies/lobby.model';
import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';

export class RandomDistributionHandler extends DistributionHandler {
  async distribute(lobby: Lobby): Promise<Lobby> {
    const players = lobby.queuedPlayers;
    const filteredPlayer = players.filter((player) =>
      player.roles.includes(LobbyPlayerRole.PLAYER),
    );
    const count = [0, 0];
    const max = filteredPlayer.length / 2;

    players.map((player) => {
      const our = Math.random() < 0.5 ? 0 : 1;
      const other = our == 0 ? 1 : 0;

      if (!player.roles.includes(LobbyPlayerRole.PLAYER)) {
        return player;
      }

      if (count[our] >= max && count[other] >= max) {
        return player;
      }

      if (count[our] >= max) {
        player.roles.push(
          other === 0 ? LobbyPlayerRole.TEAM_A : LobbyPlayerRole.TEAM_B,
        );
        count[other]++;
        return player;
      }

      player.roles.push(
        our === 0 ? LobbyPlayerRole.TEAM_A : LobbyPlayerRole.TEAM_B,
      );
      count[our]++;
      return player;
    });

    lobby.queuedPlayers = players;
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }
}

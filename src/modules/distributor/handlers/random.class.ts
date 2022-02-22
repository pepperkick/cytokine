import { DistributionHandler } from '../handler.class';
import { Lobby } from '../../lobbies/lobby.model';

export class RandomDistributionHandler extends DistributionHandler {
  async distribute(lobby: Lobby): Promise<Lobby> {
    const players = lobby.queuedPlayers;
    const filteredPlayer = players.filter((player) =>
      player.roles.includes('player'),
    );
    const count = [0, 0];
    const max = filteredPlayer.length / 2;

    players.map((player) => {
      const our = Math.random();
      const other = our >= 0.5 ? 1 : 0;

      if (!player.roles.includes('player')) {
        return player;
      }

      if (count[our] >= max && count[other] >= max) {
        return player;
      }

      if (count[our] >= max) {
        player.roles.push(other === 0 ? 'team_a' : 'team_b');
        count[other]++;
        return player;
      }

      player.roles.push(our === 0 ? 'team_a' : 'team_b');
      count[our]++;
      return player;
    });

    lobby.queuedPlayers = players;
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }
}

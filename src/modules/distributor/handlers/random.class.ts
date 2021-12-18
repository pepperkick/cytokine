import { DistributionHandler } from '../handler.class';
import { Lobby } from '../../lobbies/lobby.model';

export class RandomDistributionHandler extends DistributionHandler {
  async distribute(lobby: Lobby): Promise<Lobby> {
    const players = lobby.queuedPlayers;
    const filteredPlayer = players.filter((player) =>
      player.roles.includes('player'),
    );
    const count = [0, 0];

    players.forEach((player) => {
      const max = filteredPlayer.length / 2;
      const our = Math.floor(Math.random() * count.length);
      const other = our === 0 ? 1 : 0;

      if (!player.roles.includes('player')) {
        return player;
      }

      if (count[our] === max && count[other] === max) {
        return player;
      }

      if (count[our] === max) {
        player.roles.push(other === 0 ? 'team_a' : 'team_b');
        return player;
      }

      player.roles.push(our === 0 ? 'team_a' : 'team_b');
      return player;
    });

    lobby.queuedPlayers = players;
    lobby.markModified('queuedPlayers');
    await lobby.save();
    return lobby;
  }
}

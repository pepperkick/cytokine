import { DistributionHandler } from '../handler.class';
import { Lobby } from '../../lobbies/lobby.model';
import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';
import { PlayerJoinRequestDto } from 'src/modules/matches/player-join-request.dto';

export class RandomDistributionHandler extends DistributionHandler {
  /**
   * Verifies if a player can join a Lobby with their roles.
   * @param player The Player that wants to join.
   * @param lobby The Lobby that the Player wants to join.
   * @returns A number from -1 to 2 indicating what to do
   * -1 = Player tried to switch roles (same roles)
   * 0  = Player cannot queue
   * 1  = Player can queue in
   * 2  = Player can swap roles
   */
  async verify(player: PlayerJoinRequestDto, lobby: Lobby): Promise<number> {
    // By rule of thumb, the class roles sent from Regi are always at the end of the array.
    const wantedRole = player.roles[player.roles.length - 1];

    // Verify the requirements this Lobby has for roles.
    const wantedRoleInLobby = lobby.requirements.find(
      (r) => r.name == wantedRole,
    );

    // If the wanted role is not a requirement inside the Lobby, then return false.
    if (!wantedRoleInLobby) return 0;

    // Check if the amount required of this role is already filled.
    const playersWithRole = lobby.queuedPlayers.filter((p) =>
      p.roles.includes(wantedRole),
    );

    // Player is already queued and with a role, can they swap?
    const playerInside = playersWithRole.find(
      (p) => p.discord === player.discord,
    );
    if (playerInside) {
      // Check their roles.
      const hasRole = playerInside.roles[playerInside.roles.length - 1];

      // If they're the same, then they can't swap roles.
      return hasRole !== wantedRole ? 2 : -1;
    }

    // Return true only if the amount of players with this role is less than the amount required (there's at least one spot open).
    return playersWithRole.length < wantedRoleInLobby.count ? 1 : 0;
  }

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

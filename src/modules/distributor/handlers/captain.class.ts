import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';
import { LobbyStatus } from 'src/modules/lobbies/lobby-status.enum';
import { Lobby } from 'src/modules/lobbies/lobby.model';
import { PlayerJoinRequestDto } from 'src/modules/matches/player-join-request.dto';
import { DistributionHandler } from '../handler.class';

export class CaptainBasedHandler extends DistributionHandler {
  /**
   * Cleans all class specific roles from a player.
   *
   * @param roles The roles the Player has.
   * @param inverse If true, will filter out non-class roles. False by default.
   *
   * @returns An Array with the class roles removed.
   */
  cleanClassRoles(roles: LobbyPlayerRole[], inverse = false) {
    const classRoles = [
      LobbyPlayerRole.CAN_CAPTAIN,
      LobbyPlayerRole.SCOUT,
      LobbyPlayerRole.SOLDIER,
      LobbyPlayerRole.PYRO,
      LobbyPlayerRole.DEMOMAN,
      LobbyPlayerRole.HEAVY,
      LobbyPlayerRole.ENGINEER,
      LobbyPlayerRole.MEDIC,
      LobbyPlayerRole.SNIPER,
      LobbyPlayerRole.SPY,
      LobbyPlayerRole.RED_SCOUT,
      LobbyPlayerRole.RED_SOLDIER,
      LobbyPlayerRole.RED_PYRO,
      LobbyPlayerRole.RED_DEMOMAN,
      LobbyPlayerRole.RED_HEAVY,
      LobbyPlayerRole.RED_ENGINEER,
      LobbyPlayerRole.RED_SNIPER,
      LobbyPlayerRole.RED_MEDIC,
      LobbyPlayerRole.RED_SPY,
      LobbyPlayerRole.BLU_SCOUT,
      LobbyPlayerRole.BLU_SOLDIER,
      LobbyPlayerRole.BLU_PYRO,
      LobbyPlayerRole.BLU_DEMOMAN,
      LobbyPlayerRole.BLU_HEAVY,
      LobbyPlayerRole.BLU_ENGINEER,
      LobbyPlayerRole.BLU_SNIPER,
      LobbyPlayerRole.BLU_MEDIC,
      LobbyPlayerRole.BLU_SPY,
    ];
    return roles.filter((r) =>
      inverse ? classRoles.includes(r) : !classRoles.includes(r),
    );
  }

  /**
   * Verifies if player roles requested are allowed for the queue, and updates their existing roles or adds them as a new player.
   *
   * @param lobby The Lobby in which we're working with.
   * @param player The Player request object.
   *
   * @returns The Lobby with the updated player.
   */
  async updateOrAddPlayer(lobby: Lobby, player: PlayerJoinRequestDto) {
    // Is this Lobby in a non-queueable status?
    if (lobby.status !== LobbyStatus.WAITING_FOR_REQUIRED_PLAYERS) return lobby;

    // Check if the player is already queued.
    const p = lobby.queuedPlayers.find((p) => p.discord === player.discord);

    if (p) {
      // Clean the class roles of the player (if any are existing) and only keep technical ones.
      p.roles = this.cleanClassRoles(p.roles);

      // Add the new class roles to the player.
      p.roles = [...this.cleanClassRoles(player.roles, true), ...p.roles];
    }
    // Add the player to the queue.
    else
      lobby.queuedPlayers.push({
        name: player.name,
        discord: player.discord,
        roles: player.roles,
      });

    // Return the new Lobby document.
    lobby.markModified('queuedPlayers');
    return await lobby.save();
  }
}

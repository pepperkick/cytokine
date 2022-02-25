import { LobbyPlayerRole } from 'src/modules/lobbies/lobby-player-role.enum';
import { Lobby } from 'src/modules/lobbies/lobby.model';
import { Player } from 'src/modules/matches/match-player.interface';
import { DistributionHandler } from '../handler.class';

/**
 * TODO: Rewrite this. It works and it's not bad, but could be done better.
 */
export class TeamRoleBasedHandler extends DistributionHandler {
  async addOrUpdatePlayer(player: Player, lobby: Lobby): Promise<Lobby> {
    // Check if the player is already in the Lobby to update their roles
    const queuedPlayer = lobby.queuedPlayers.find(
      (queuedPlayer) => queuedPlayer.discord === player.discord,
    );

    if (queuedPlayer) queuedPlayer.roles = [...player.roles];
    else lobby.queuedPlayers.push(player);

    lobby.markModified('queuedPlayers');
    return await lobby.save();
  }

  async isPlayerAllowed(player: Player, lobby: Lobby): Promise<boolean> {
    // Create a temporary lobby copy as to not modify the original document
    let tlobby: any = { ...lobby };
    tlobby = tlobby._doc;

    const wantedRole = player.roles[player.roles.length - 1],
      before = this.verify(lobby);

    // Is the player already queued here? If so try to check if they're trying to change roles.
    const queuedPlayer = tlobby.queuedPlayers.find(
      (p: Player) => p.discord === player.discord,
    );
    if (queuedPlayer) {
      // Are they the same? Then don't allow them to change roles
      if (queuedPlayer.roles.includes(wantedRole)) return false;

      // Verify if role modification is allowed
      queuedPlayer.roles = [...player.roles];

      const res = this.verify(tlobby);

      // If wanted role is unfilled, then allow them to change roles
      // NAND value of before and after
      //
      // This only returns false if both are true.
      return !(before[wantedRole] && res[wantedRole]);
    }

    // Add the player to the temporary lobby
    tlobby.queuedPlayers.push(player);

    const res = await this.verify(tlobby);

    // If the role is unfilled and teams aren't full, then allow them to join.
    // NAND value of before and after
    return (
      !(before[wantedRole] && before['teams']) &&
      !(res[wantedRole] && res['teams'])
    );
  }

  /**
   * Verifies a Lobbies' requirements.
   * @param lobby The Lobby to verify.
   * @returns An object with all requirements listed and it's filled status.
   */
  private verify(lobby: Lobby | any) {
    const roles = {};
    // Verify that roles set on all players pass the requirements needed for the Lobby
    for (const requirement of lobby.requirements) {
      const met = lobby.queuedPlayers.filter((player) =>
        player.roles.includes(requirement.name),
      );

      // If the requirement amount is met, pass
      // If overfill is allowed, then pass too
      roles[requirement.name] =
        met.length >= requirement.count ||
        (met.length >= requirement.count && requirement.overfill);
    }

    // Now to validate team count
    const teams = lobby.queuedPlayers.filter(
      (player) =>
        player.roles.includes(LobbyPlayerRole.TEAM_A) ||
        player.roles.includes(LobbyPlayerRole.TEAM_B),
    );

    // If it sums up to the Maximum Player count, then teams are valid
    roles['teams'] = teams.length === lobby.maxPlayers;

    return roles;
  }
}

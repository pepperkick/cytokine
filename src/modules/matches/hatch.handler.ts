import axios from 'axios';
import { Logger } from '@nestjs/common';
import { Server } from '../../objects/server.interface';
import { Player } from './match-player.interface';
import { LobbyPlayerRole } from '../lobbies/lobby-player-role.enum';

export class HatchHandler {
  private readonly logger = new Logger(HatchHandler.name);

  constructor(
    private readonly ip: string,
    private readonly port: string,
    private readonly password: string,
  ) {}

  static GetForServer(server: Server): HatchHandler {
    return new HatchHandler(
      server.ip,
      server.data.hatchAddress,
      server.data.hatchPassword,
    );
  }

  /**
   * Gets server status info
   */
  async getStatus() {
    try {
      const { data } = await axios.get(
        `http://${this.ip}${this.port}/status?password=${this.password}`,
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }

  /**
   * Kick all players from server
   */
  async kickAll() {
    try {
      const { data } = await axios.get(
        `http://${this.ip}${this.port}/common/kickall?password=${this.password}`,
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }

  /**
   * Enable whitelist restriction
   */
  async enableWhitelistRestriction() {
    try {
      const { data } = await axios.post(
        `http://${this.ip}${this.port}/whitelist/enable?password=${this.password}`,
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }

  /**
   * Disable whitelist restriction
   */
  async disableWhitelistRestriction() {
    try {
      const { data } = await axios.delete(
        `http://${this.ip}${this.port}/whitelist/enable?password=${this.password}`,
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }

  /**
   * Add player to whitelist
   */
  async addWhitelistPlayer(player: Player) {
    try {
      let team = '',
        role = '';

      if (
        player.roles.includes(<LobbyPlayerRole>'team_a') ||
        player.roles.filter((r) => r.includes('red')).length > 0
      ) {
        team = 'RED';
      } else if (
        player.roles.includes(<LobbyPlayerRole>'team_b') ||
        player.roles.filter((r) => r.includes('blu')).length > 0
      ) {
        team = 'BLU';
      }

      if (
        player.roles.includes(<LobbyPlayerRole>'scout') ||
        player.roles.filter((r) => r.includes('scout')).length > 0
      ) {
        role = LobbyPlayerRole.SCOUT;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'soldier') ||
        player.roles.filter((r) => r.includes('soldier')).length > 0
      ) {
        role = LobbyPlayerRole.SOLDIER;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'pyro') ||
        player.roles.filter((r) => r.includes('pyro')).length > 0
      ) {
        role = LobbyPlayerRole.PYRO;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'heavy') ||
        player.roles.filter((r) => r.includes('heavy')).length > 0
      ) {
        role = LobbyPlayerRole.HEAVY;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'demoman') ||
        player.roles.filter((r) => r.includes('demoman')).length > 0
      ) {
        role = LobbyPlayerRole.DEMOMAN;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'engineer') ||
        player.roles.filter((r) => r.includes('engineer')).length > 0
      ) {
        role = LobbyPlayerRole.ENGINEER;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'sniper') ||
        player.roles.filter((r) => r.includes('sniper')).length > 0
      ) {
        role = LobbyPlayerRole.SNIPER;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'medic') ||
        player.roles.filter((r) => r.includes('medic')).length > 0
      ) {
        role = LobbyPlayerRole.MEDIC;
      } else if (
        player.roles.includes(<LobbyPlayerRole>'spy') ||
        player.roles.filter((r) => r.includes('spy')).length > 0
      ) {
        role = LobbyPlayerRole.SPY;
      }

      const { data } = await axios.post(
        `http://${this.ip}${this.port}/whitelist/player/?password=${this.password}`,
        {
          steam: player.steam,
          name: player.name,
          team: team,
          class: role,
        },
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }

  /**
   * Remove player from whitelist
   */
  async removeWhitelistPlayer(player: Player) {
    try {
      const { data } = await axios.delete(
        `http://${this.ip}${this.port}/whitelist/player/${player.steam}?password=${this.password}`,
      );

      return data;
    } catch (error) {
      this.logger.error(error.response.data);
    }
  }
}

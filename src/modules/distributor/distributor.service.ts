import { Logger } from '@nestjs/common';
import { DistributionType } from '../../objects/distribution.enum';
import { RandomDistributionHandler } from './handlers/random.class';
import { Lobby } from '../lobbies/lobby.model';
import { TeamRoleBasedHandler } from './handlers/team-role-based.class';

export class DistributorService {
  readonly logger = new Logger(DistributorService.name);

  async distribute(lobby: Lobby) {
    this.logger.log(
      `Starting distribution for ${lobby._id} lobby with ${lobby.distribution} type.`,
    );

    switch (lobby.distribution) {
      case DistributionType.RANDOM:
        return new RandomDistributionHandler().distribute(lobby);
    }
  }
}

import { Logger, NotImplementedException } from '@nestjs/common';
import { Lobby } from '../lobbies/lobby.model';

export interface DistributionOptions {}

export class DistributionHandler {
  readonly logger = new Logger(DistributionHandler.name);

  async distribute(
    lobby: Lobby,
    options?: DistributionOptions,
  ): Promise<Lobby> {
    throw new NotImplementedException();
  }
}

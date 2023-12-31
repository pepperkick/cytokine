export enum ServerStatus {
  INIT = 'INIT',
  ALLOCATING = 'ALLOCATING',
  WAITING = 'WAITING',
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  CLOSING = 'CLOSING',
  DEALLOCATING = 'DEALLOCATING',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED',
}

export interface Server {
  _id?: string;
  client?: string;
  game: string;
  createdAt?: Date;
  closeAt?: Date;
  ip?: string;
  port?: number;
  region: string;
  provider: string;
  image?: string;
  status?: ServerStatus;
  data: {
    // For TF2, Valheim
    password?: string;

    // For TF2
    servername?: string;
    rconPassword?: string;
    sdrEnable?: boolean;
    sdrIp?: string;
    sdrPort?: number;
    sdrTvPort?: number;
    tvEnable?: boolean;
    tvPassword?: string;
    tvPort?: number;
    tvName?: string;
    map?: string;
    config?: string;

    // For Minecraft
    rconPort?: number;

    // For Valheim
    world?: string;

    // For Status Updates
    callbackUrl?: string;

    // For Auto Close
    closeMinPlayers?: number;
    closeIdleTime?: number;
    closeWaitTime?: number;

    // For Git Repository
    gitRepository?: string;
    gitDeployKey?: string;

    // For Hatch
    hatchAddress?: string;
    hatchPassword?: string;
    hatchElasticURL?: string;
    hatchElasticChatIndex?: string;
    hatchElasticLogsIndex?: string;
  };
}

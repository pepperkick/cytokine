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
  _id: string;
  client: string;
  provider: string;
  callbackUrl?: string;
  region: string;
  game: string;
  createdAt: Date;
  status: ServerStatus;
  closePref: {
    minPlayers: number;
    idleTime: number;
  };
  password: string;
  rconPassword: string;
  ip: string;
  port: number;
  tvPort: number;
  closeAt?: Date;
}

export interface ServerRequestOptions {
  game: string;
  region: string;
  provider: string;
  data?: any;
  callbackUrl?: string;
  closePref?: {
    minPlayers?: number;
    idleTime?: number;
    waitTime?: number;
  };
}

import { Client } from '../clients/client.model';

export interface RequestWithClient extends Request {
  client: Client
}
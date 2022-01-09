export enum MatchStatus {
  UNKNOWN = 'UNKNOWN', // Match is in unknown status
  WAITING_FOR_LOBBY = 'WAITING_FOR_LOBBY', // Waiting for required players to join the lobby
  LOBBY_READY = 'LOBBY_READY', // Lobby is ready
  CREATING_SERVER = 'CREATING_SERVER', // Server for this match is being created
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS', // Waiting for players to join
  WAITING_TO_START = 'WAITING_TO_START', // Waiting for players to start the match
  LIVE = 'LIVE', // Match is live
  FINISHED = 'FINISHED', // Match has finished
  FAILED = 'FAILED', // An error occurred during processing of the match
}

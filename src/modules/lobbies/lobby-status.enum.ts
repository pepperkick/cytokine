export enum LobbyStatus {
  UNKNOWN = 'UNKNOWN', // Match is in unknown status
  WAITING_FOR_REQUIRED_PLAYERS = 'WAITING_FOR_REQUIRED_PLAYERS', // Waiting for required players to join the match
  DISTRIBUTING = 'DISTRIBUTING', // Distributing the players among teams
  DISTRIBUTED = 'DISTRIBUTED', // Distribution has completed
}

export enum LobbyStatus {
  UNKNOWN = 'UNKNOWN', // Match is in unknown status
  WAITING_FOR_REQUIRED_PLAYERS = 'WAITING_FOR_REQUIRED_PLAYERS', // Waiting for required players to join the match
  WAITING_FOR_AFK = 'WAITING_FOR_AFK', // Waiting for the AFK check to finish
  AFK_PASSED = 'AFK_PASSED', // AFK check passed
  PICKING = 'PICKING', // Only on Captain based lobbies: Captains are picking players
  DISTRIBUTING = 'DISTRIBUTING', // Distributing the players among teams
  DISTRIBUTED = 'DISTRIBUTED', // Distribution has completed
  EXPIRED = 'EXPIRED', // The Lobby has expired
  CLOSED = 'CLOSED', // Lobby has been closed by an admin/other
}

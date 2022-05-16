export enum LobbyStatus {
  UNKNOWN = 'UNKNOWN', // Match is in unknown status
  WAITING_FOR_REQUIRED_PLAYERS = 'WAITING_FOR_REQUIRED_PLAYERS', // Waiting for required players to join the match
  WAITING_FOR_AFK_CHECK = 'WAITING_FOR_AFK_CHECK', // Waiting for AFK check to complete
  WAITING_FOR_PICKS = 'WAITING_FOR_PICKS', // Waiting for picks on both teams to be completed
  DISTRIBUTING = 'DISTRIBUTING', // Distributing the players among teams
  DISTRIBUTED = 'DISTRIBUTED', // Distribution has completed
  EXPIRED = 'EXPIRED', // The Lobby has expired
  CLOSED = 'CLOSED', // Lobby has been closed by an admin/other
}

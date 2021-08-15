export enum MatchStatus {
  UNKNOWN = "UNKNOWN",                            // Match is in unknown status
  WAITING_FOR_MINIMUM_PLAYERS
    = "WAITING_FOR_MINIMUM_PLAYERS",              // Waiting for minimum players to join the match
  LIVE = "LIVE",                                  // Match is live
}
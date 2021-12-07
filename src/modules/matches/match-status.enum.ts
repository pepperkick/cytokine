export enum MatchStatus {
  UNKNOWN = "UNKNOWN",                  // Match is in unknown status
  WAITING_FOR_REQUIRED_PLAYERS
    = "WAITING_FOR_REQUIRED_PLAYERS",   // Waiting for required players to join the match
  CREATING_SERVER
    = "CREATING_SERVER",                // Server for this match is being created
  WAITING = "WAITING",                  // Waiting for players to join
  LIVE = "LIVE",                        // Match is live
  FAILED = "FAILED"                     // An error occurred during processing of the match
}
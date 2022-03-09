export enum LobbyPlayerRole {
  PLAYER = 'player', // User is a player in the Lobby
  CAPTAIN_A = 'captain-a', // User is a captain for team A and can pick players (gets the first pick too)
  CAPTAIN_B = 'captain-b', // User is a captain for team B and can pick players
  CREATOR = 'creator', // User is the creator of the Lobby (currently unused)
  TEAM_A = 'team_a', // User is playing in the A Team
  TEAM_B = 'team_b', // User is playing in the B Team

  // TF2 specific roles
  SCOUT = 'scout', // User is a Scout
  SOLDIER = 'soldier', // User is a Soldier
  PYRO = 'pyro', // User is a Pyro
  DEMOMAN = 'demoman', // User is a Demoman
  HEAVY = 'heavy', // User is a Heavy
  ENGINEER = 'engineer', // User is an Engineer
  MEDIC = 'medic', // User is a Medic
  SNIPER = 'sniper', // User is a Sniper
  SPY = 'spy', // User is a Spy

  // Team Based Roles (Soon to be Deprecated)
  RED_SCOUT = 'red-scout',
  RED_SOLDIER = 'red-soldier',
  RED_PYRO = 'red-pyro',
  RED_DEMOMAN = 'red-demoman',
  RED_HEAVY = 'red-heavy',
  RED_ENGINEER = 'red-engineer',
  RED_SNIPER = 'red-sniper',
  RED_MEDIC = 'red-medic',
  RED_SPY = 'red-spy',

  BLU_SCOUT = 'blu-scout',
  BLU_SOLDIER = 'blu-soldier',
  BLU_PYRO = 'blu-pyro',
  BLU_DEMOMAN = 'blu-demoman',
  BLU_HEAVY = 'blu-heavy',
  BLU_ENGINEER = 'blu-engineer',
  BLU_SNIPER = 'blu-sniper',
  BLU_MEDIC = 'blu-medic',
  BLU_SPY = 'blu-spy',
}

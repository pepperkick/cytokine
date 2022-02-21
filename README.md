# Cytokine - Pick-up Game Lobby System

Manages, organizes and administers live lobbies with **Lighthouse** support.

## Configuration [config.json]
| Property | Value | Example |
|----------|-------|---------|
| ``mongodbUri`` | MongoDB Connect URI | ``mongodb://admin:123@localhost:27017/cytokine`` |
| ``localhost`` | URI on where Cytokine is hosted at for other services to communicate | ``http://localhost:3000`` |
| ``monitoring.enabled`` | Will monitor lobbies and matches for status update handling and management every ``monitoring.interval`` seconds | ``true`` |
| ``monitoring.interval`` | Controls how many second(s) should Cytokine monitor for changes in lobbies & matches | ``15`` |
| ``lighthouse.host`` | Where are Lighthouse's endpoints hosted at | ``http://localhost:4000`` |
| ``lighthouse.clientId`` | Client identificator for usage of Lighthouse's services | ``PepperKick`` |
| ``lighthouse.clientSecret`` | Client secret phrase for authentication to Lighthouse's services | ``123`` |

## Database Schemas
### Client
A user allowed to interact with Cytokine's API. Must be manually created.
- ``id`` - Unique identifier for a Cytokine client
- ``secret`` - Secret phrase to authenticate a Cytokine client
- ``name`` - The client's name
- ``access`` - Contains permissions/access information to Cytokine's services
    - ``games`` - Array of game names this client has access to manage lobbies of
    - ``limit`` - Amount of servers this client can create requests for (Lighthouse)
    - ``regions`` - Array of regions this client has access to create server requests for (Lighthouse)

Example Document:
```json
{
  "id": "test",
  "secret": "123",
  "name": "puntero",
  "access": {
    "games": [
      "tf2"
    ],
    "limit": 2,
    "regions": {
      "sydney": {
        "limit": 2
      }
    }
  }
}
```

### Lobby
Represents a Lobby where players can join, leave and get general information of at any time.
This is not the same as a [Match](https://github.com/Qixalite/cytokine#Match) whereas it represents the live game.
- ``createdAt`` - Date when this Lobby was created
- ``createdBy`` - Discord ID of the user that created this Lobby
- ``match`` - MongoDB ID of the [``Match``](https://github.com/Qixalite/cytokine#Match) document linked to this Lobby
- ``client`` - The Cytokine client ID that allowed this lobby's creation
- ``callbackUrl`` - URL that points to Regi-Cytokine's service for status update notifications
- ``status`` - Current ``LobbyStatus`` of this lobby
- ``distribution`` - The distribution method selected for this lobby
- ``queuedPlayers`` - Array of ``Player`` instances who are currently queued in this lobby
- ``requirements`` - Array of ``RoleRequirement``s that define the format this lobby is played in
- ``maxPlayers`` - Maximum amount of players allowed to queue/join this lobby
- ``data``* - Custom information

Example Document:
```js
{
  "createdAt": 2022-02-07T21:55:39.486+00:00,
  "createdBy": "112720277883895808",
  "match": "6201955b7192fa6a68dbdb7b",
  "client": "test",
  "callbackUrl": "http://localhost:3000/lobbies/callback",
  "status": "WAITING_FOR_REQUIRED_PLAYERS",
  "distribution": "RANDOM",
  "queuedPlayers": [
    {
      "name": "puntero",
      "discord": "112720277883895808",
      "steam": "76561198061538510",
      "roles": [ "creator", "player" ]
    }
  ],
  "requirements": [ ... ],
  "maxPlayers": 12
}
```

### Match
Represents a Match; a LIVE game with already defined player teams, classes, format and server.
This is not the same as a [Lobby](https://github.com/Qixalite/cytokine#Lobby) whereas the latter represents a "waiting room" / unprepared game.
- ``createdAt`` - Date when this Match was created
- ``client`` - The Cytokine client ID that allowed this match's creation
- ``game`` - The game this match is for
- ``map`` - Map name being played for this match
- ``callbackUrl`` - URL that points to Regi-Cytokine's service for status update notifications
- ``status`` - Current ``MatchStatus`` of this match
- ``region`` - Region the match is set on (Lighthouse)
- ``server`` - The MongoDB Document ID of the Lighthouse server this Match is linked with
- ``players`` - Array of ``Player`` instances who are locked into this match
- ``preferences`` - Object with custom parameters for the match
     - ``createLighthouseServer`` - If true, the Match will wait until Lighthouse successfully launches a server for the specified game to continue. Else it will update its status to ``LIVE`` instantly as soon as its criteria are met (full players, met requirements)
     - ``valveSdr`` - If true, Lighthouse will start the server utilizing **VALVe's SDR**.
     - ``gameConfig`` - The path (relative to ``tf/cfg/``) of the config that'll be utilized in this Match.
- ``data`` - Used to store Hatch information from the server once the Match finishes.
     - ``logstfUrl`` - The URL to the resultant Match log (hosted on https://logs.tf/)
     - ``demostfUrl`` - The URL to the resultant Match STV demo (hosted on https://demos.tf/)
     - ``teamScore`` - The scores of both teams at the end of the Match (**FINISHED**)

Example Document:
```js
{
  "createdAt": 2022-02-07T21:55:39.486+00:00,
  "client": "test",
  "game": "tf2",
  "map": "cp_process_final",
  "callbackUrl": "http://localhost:3000/matches/callback",
  "status": "LIVE",
  "region": "sydney",
  "server": "61fedd6a2f98f356a87b1f46",
  "players": [ ... ],
  "preferences": {
    "createLighthouseServer": true
    "valveSdr": true,
    "gameConfig": "ugc/6s_base.cfg"
  },
  "data": {}
}
```

## API

### Lobby API

#### GET /api/v1/lobbies/
Returns a list of active lobbies created by the specified client.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``all`` - If true it will get all lobbies regardless of an active status. Default: ``false``

##### Response
```
{
  "lobbies": [
    Lobby,
    Lobby,
    Lobby,
    ...
  ]
}
```

_________________

#### POST /api/v1/lobbies/
Creates a new request for a Lobby to be created.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Body
```js
{
  // Distribution method this lobby will utilize.
  "distribution": "RANDOM",
  
  // A name this Lobby will be displayed to users by
  "name": "Alpha",
  
  // Callback URL to Regi-Cytokine for status updates on this Lobby
  "callbackUrl": "http://localhost:3000/lobbies/callback",
  
  // Array of Player instances who are queued into the Lobby
  "queuedPlayers": [
    {
      "name": "puntero",
      "discord": "112720277883895808",
      "steam": "76561198061538510",
      "roles": [ "creator", "player" ]
    }
  ],
  
  // Format Requirements that have been selected for this Lobby (Sent by Regi-Cytokine)
  "requirements": [
    { "name": "blu-scout", "count": 2 }
  ],
  
  // Discord User ID of the Lobby's creator
  "userId": "112720277883895808"
  
  // Options for the Match document
  "matchOptions": {
    // Queued players
    "players": [],
    
    // Game this Lobby is for
    "game": "tf2",
    
    // Region the server will be hosted in
    "region": "sydney",
    
    // The map name to be played on the Match
    "map": "cp_process_final",
    
    // Amount of players required for the Lobby to be ready (Match.status = "LOBBY_READY")
    "requiredPlayers": 12,
    
    // Optional preferences
    "preference": {
      // Queries Lighthouse for a new server to be created once the Match is ready to begin
      "createLighthouseServer": true,
      
      // Wether or not use Valve SDR's system
      "valveSdr": true,

      // The game config to use on the server
      "gameConfig": "ugc/6s_base.cfg"
    }
}
```

##### Response
The newly created [Lobby](https://github.com/Qixalite/cytokine#Lobby) document with specified parameters if successful.

##### Status Codes
- **400** - Already created a Lobby or queued in another one
- **200** - Success

_________________

#### DELETE /api/v1/lobbies/:id
Creates a new request to close an active Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we want to close

##### Response
The updated [Lobby](https://github.com/Qixalite/cytokine#Lobby) document.

##### Status Codes
- **200** - Success

_________________

#### GET /api/v1/lobbies/:id
Gets a Lobby document by its ID.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we want to get

##### Response
The [Lobby](https://github.com/Qixalite/cytokine#Lobby) document if found.

##### Status Codes
- **404** - Lobby wasn't found
- **200** - Success

_________________

#### GET /api/v1/lobbies/match/:id
Gets a Lobby document by its linked Match ID.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Match linked to the Lobby we want to get

##### Response
The [Lobby](https://github.com/Qixalite/cytokine#Lobby) document if found.

##### Status Codes
- **404** - Lobby wasn't found
- **200** - Success

_________________

#### POST /api/v1/lobbies/:id/join
Creates a request to place a new player into a Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby this player is joining

##### Body
```json
{
  "name": "puntero",
  "discord": "112720277883895808",
  "steam": "76561198061538510",
  "roles": [ "creator", "player" ]
}
```

_________________

#### DELETE /api/v1/lobbies/:id/players/:type/:pid
Creates a request to remove a Player from a Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we're looking for the player in
- ``type`` - The type of ID we're using as filter (Can be ``discord``, ``steam`` or ``name``)
- ``pid`` - The player's ID depending on ``type``

##### Response
The updated [Lobby](https://github.com/Qixalite/cytokine#Lobby) document.

##### Status Codes
- **400** - Player can't leave the Lobby because of the Lobby's staus
- **200** - Success

_________________

#### GET /api/v1/lobbies/:id/players/:type/:pid
Gets a player inside a Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we're looking for the player in
- ``type`` - The type of ID we're using as filter (Can be ``discord``, ``steam`` or ``name``)
- ``pid`` - The player's ID depending on ``type``

##### Response
The **Player** object if found inside the Lobby's queued players.

##### Status Codes
- **200** - Success

_________________

#### POST /api/v1/lobbies/:id/players/:type/:pid/roles/:role
Adds a new role to a Player currently queued inside a Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we're looking for the player in
- ``type`` - The type of ID we're using as filter (Can be ``discord``, ``steam`` or ``name``)
- ``pid`` - The player's ID depending on ``type``
- ``role`` - The role to add onto the player

##### Response
The updated [Lobby](https://github.com/Qixalite/cytokine#Lobby) document.

##### Status Codes
- **400** - No access to add/remove a role onto/from a Player
- **404** - Player wasn't found in that Lobby
- **200** - Success

_________________

#### DELETE /api/v1/lobbies/:id/players/:type/:pid/roles/:role
Removes a role from a Player inside a Lobby.

##### Headers
```
Authorization: Bearer <mongodb.cytokine.client.secret>
```

##### Parameters
- ``id`` - The ID of the Lobby we're looking for the player in
- ``type`` - The type of ID we're using as filter (Can be ``discord``, ``steam`` or ``name``)
- ``pid`` - The player's ID depending on ``type``
- ``role`` - The role to remove from the player

##### Response
The updated [Lobby](https://github.com/Qixalite/cytokine#Lobby) document.

##### Status Codes
- **400** - No access to add/remove a role onto/from a Player
- **404** - Player wasn't found in that Lobby
- **200** - Success

_________________

## License

All rights are reserved to Qixalite.

Permission must be granted explicitly by Qixalite to use, copy, modify, and distribute this code and its related documentation for any reason.

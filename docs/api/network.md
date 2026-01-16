# Network Layer API

API reference for the P2P networking layer (`src/lib/network/`).

## 📖 Overview

The network layer handles all peer-to-peer communication using Trystero (WebRTC). It manages room connections, message passing, and state synchronization between players.

## 📁 Module Structure

```
src/lib/network/
├── room.ts       # Room connection management
├── messages.ts   # Message type definitions and validation
├── host.ts       # Host-specific logic (state broadcast)
└── sync.ts       # State synchronization utilities
```

## 🌐 room.ts

### Constants

```typescript
const APP_ID = 'gametime-bingo';
const TRACKER_URLS = [
  'wss://tracker.webtorrent.dev',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
];
```

### `joinRoom(roomCode: string): TrysteroRoom`

Joins a Trystero room for P2P communication.

**Parameters**:
- `roomCode`: 6-character room code

**Returns**: Trystero room object with methods:
- `makeAction<T>(name: string)`: Create typed message actions
- `leave()`: Leave the room
- `getPeers()`: Get connected peer IDs
- `onPeerJoin(callback)`: Peer connection event
- `onPeerLeave(callback)`: Peer disconnection event

**Example**:
```typescript
import { joinRoom } from '$lib/network/room';

const room = joinRoom('ABC123');

// Create message action
const [sendGameMessage, onGameMessage] = room.makeAction<MessagePayload>('game');

// Send message
sendGameMessage({ type: 'player-join', player: { id: '123', name: 'Alice' } });

// Receive messages
onGameMessage((payload, peerId) => {
  console.log('Received from', peerId, ':', payload);
});

// Peer events
room.onPeerJoin((peerId) => console.log('Peer joined:', peerId));
room.onPeerLeave((peerId) => console.log('Peer left:', peerId));

// Leave room
room.leave();
```

---

### `stopPeerDiscovery(): void`

Pauses tracker reconnection (call when game starts).

---

### `resumePeerDiscovery(): void`

Resumes tracker reconnection (call when returning to lobby).

---

## 📨 messages.ts

### Message Types

All messages use discriminated unions for type safety:

```typescript
type MessagePayload =
  | SyncStatePayload
  | PlayerJoinPayload
  | PlayerLeavePayload
  | StartGamePayload
  | CallNumberPayload
  | NumberCalledPayload
  | BingoPayload
  | GameOverPayload;
```

### Message Interfaces

#### `SyncStatePayload`

Full game state broadcast from host.

```typescript
interface SyncStatePayload {
  type: 'sync-state';
  session: {
    id: string;
    status: GameStatus;
    hostId: string;
    players: SyncedPlayerPayload[];
    currentTurnIndex: number;
    calledNumbers: number[];
    winnerId: string | null;
  };
  timestamp: number;
}
```

**When sent**: Player joins, reconnects, or desync detected

---

#### `PlayerJoinPayload`

Player requests to join game.

```typescript
interface PlayerJoinPayload {
  type: 'player-join';
  player: {
    id: string;
    name: string;
  };
}
```

**Sender**: New player → Host  
**Response**: Host broadcasts `sync-state`

---

#### `CallNumberPayload`

Player calls a number during their turn.

```typescript
interface CallNumberPayload {
  type: 'call-number';
  playerId: string;
  number: number;
}
```

**Sender**: Player → Host  
**Response**: Host broadcasts `number-called`

---

#### `NumberCalledPayload`

Host announces a number was called.

```typescript
interface NumberCalledPayload {
  type: 'num-called';
  number: number;
  calledBy: string;
  nextTurnIndex: number;
  timestamp: number;
}
```

**Sender**: Host → All players

---

### Type Guards

Type guards validate message structure:

```typescript
export function isSyncState(msg: MessagePayload): msg is SyncStatePayload {
  return msg.type === 'sync-state' && 
         typeof msg.timestamp === 'number' &&
         msg.session !== undefined;
}

export function isPlayerJoin(msg: MessagePayload): msg is PlayerJoinPayload {
  return msg.type === 'player-join' &&
         typeof msg.player.id === 'string' &&
         typeof msg.player.name === 'string';
}

// ... other type guards for each message type
```

**Usage**:
```typescript
import { isCallNumber } from '$lib/network/messages';

function handleMessage(msg: MessagePayload) {
  if (isCallNumber(msg)) {
    // TypeScript knows msg is CallNumberPayload
    console.log('Calling number:', msg.number);
  }
}
```

---

## 🎯 host.ts

Host-specific logic for managing game state and broadcasting updates.

### `broadcastSyncState(room: TrysteroRoom, session: GameSession): void`

Broadcasts full game state to all players.

**Parameters**:
- `room`: Trystero room object
- `session`: Current game session

**When to use**:
- New player joins
- Player reconnects
- Desync detected

---

### `handlePlayerJoin(session: GameSession, payload: PlayerJoinPayload): GameSession`

Handles a player join request.

**Returns**: Updated session with new player added

---

### `handleCallNumber(session: GameSession, payload: CallNumberPayload): GameSession`

Validates and processes a number call.

**Validation**:
- Is it the player's turn?
- Is the number valid (1-25)?
- Has it not been called already?

**Returns**: Updated session with number called and turn advanced

---

## 🔄 sync.ts

State synchronization utilities.

### `deserializeSession(payload: SyncStatePayload): GameSession`

Converts a network payload to a GameSession object.

**Parameters**:
- `payload`: Sync state payload from host

**Returns**: `GameSession` object

---

### `serializeSession(session: GameSession): SyncStatePayload['session']`

Converts a GameSession to network-safe format.

**Parameters**:
- `session`: Game session

**Returns**: Serializable session object

---

## 🔒 Security & Validation

### Always Validate Messages

```typescript
import { isCallNumber } from '$lib/network/messages';
import { isValidNumber } from '$lib/game/validation';

function handleMessage(msg: MessagePayload) {
  // Type guard
  if (!isCallNumber(msg)) {
    console.warn('Invalid message type');
    return;
  }
  
  // Content validation
  if (!isValidNumber(msg.number)) {
    console.warn('Invalid number:', msg.number);
    return;
  }
  
  // Business logic validation
  if (isNumberCalled(session, msg.number)) {
    console.warn('Number already called');
    return;
  }
  
  // Process valid message
  processCallNumber(msg);
}
```

---

## ⚡ Performance Tips

### Keep Payloads Small

```typescript
// ✅ DO: Minimal payload
const payload: NumberCalledPayload = {
  type: 'num-called',
  number: 7,
  calledBy: 'player-1',
  nextTurnIndex: 1,
  timestamp: Date.now(),
};

// ❌ DON'T: Include unnecessary data
const badPayload = {
  type: 'num-called',
  number: 7,
  calledBy: 'player-1',
  nextTurnIndex: 1,
  timestamp: Date.now(),
  entireSession: session,  // ❌ Too large!
  allCards: [...],  // ❌ Never send cards!
};
```

### Use Delta Updates

```typescript
// ✅ DO: Send only what changed
broadcastNumberCalled(number, playerId, turnIndex);

// ❌ DON'T: Send full state for every action
broadcastSyncState(session);  // Too heavy for frequent updates
```

---

## 🐛 Debugging

### Enable Debug Logging

```typescript
// Temporarily add for debugging (remove before committing)
function handleMessage(msg: MessagePayload) {
  console.log('[P2P] Received:', msg);
  // ... handle message
}

function sendMessage(payload: MessagePayload) {
  console.log('[P2P] Sending:', payload);
  send(payload);
}
```

### Check Connection State

```typescript
import { getPeers } from '$lib/network/room';

const peers = room.getPeers();
console.log('Connected peers:', Object.keys(peers));
```

---

## 🧪 Testing

### Mock Trystero

```typescript
import { vi } from 'vitest';

vi.mock('trystero', () => ({
  joinRoom: vi.fn(() => ({
    makeAction: vi.fn(() => [vi.fn(), vi.fn()]),
    leave: vi.fn(),
    getPeers: vi.fn(() => ({})),
    onPeerJoin: vi.fn(),
    onPeerLeave: vi.fn(),
  })),
}));
```

### Test Message Validation

```typescript
import { describe, it, expect } from 'vitest';
import { isCallNumber } from '$lib/network/messages';

describe('isCallNumber', () => {
  it('should accept valid message', () => {
    const msg = { 
      type: 'call-number', 
      playerId: '123', 
      number: 5 
    };
    expect(isCallNumber(msg)).toBe(true);
  });
  
  it('should reject invalid number', () => {
    const msg = { 
      type: 'call-number', 
      playerId: '123', 
      number: 26  // Invalid
    };
    expect(isCallNumber(msg)).toBe(false);
  });
});
```

---

## 📚 Related Documentation

- [Multiplayer P2P Guide](../features/multiplayer.md)
- [Architecture Overview](../architecture.md)
- [Game Logic API](./game-logic.md)
- [P2P Protocol Spec](../../specs/001-bingo-game/contracts/p2p-protocol.md)

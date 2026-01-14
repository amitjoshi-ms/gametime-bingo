# P2P Message Protocol

**Feature**: 001-bingo-game  
**Date**: 2026-01-13  
**Transport**: Trystero (WebRTC DataChannel)

## Overview

All communication between peers uses Trystero's `makeAction` API. Messages are JSON-serialized and automatically chunked by Trystero.

```typescript
// Pattern: Create typed actions
const [sendX, onX] = room.makeAction<PayloadType>('actionName')
```

---

## Message Actions

### 1. `sync-state` (Host → All)

Full game state broadcast from host. Used sparingly for full state synchronization:
- When a new player joins (initial state snapshot)
- On player reconnection after disconnect
- When host detects potential desync

**Note**: For normal gameplay events (number called, player leaves), use delta messages (`number-called`, `player-left`) instead to minimize network overhead.

```typescript
interface SyncStatePayload {
  type: 'sync-state'
  session: {
    id: string
    status: 'lobby' | 'playing' | 'completed'
    hostId: string
    players: Array<{
      id: string
      name: string
      connectionStatus: 'connected' | 'reconnecting' | 'disconnected'
      isHost: boolean
    }>
    currentTurnIndex: number
    calledNumbers: number[]
    winnerId: string | null
  }
  timestamp: number
}
```

**Sender**: Host only  
**Receivers**: All connected peers

---

### 2. `player-join` (New Player → Host)

Sent when a player connects to the room.

```typescript
interface PlayerJoinPayload {
  type: 'player-join'
  player: {
    id: string
    name: string
  }
}
```

**Sender**: New player  
**Receiver**: Host  
**Response**: Host broadcasts `sync-state` to all

---

### 3. `player-leave` (Leaving Player → Host)

Sent when a player intentionally leaves (close tab, click leave).

```typescript
interface PlayerLeavePayload {
  type: 'player-leave'
  playerId: string
  reason: 'intentional' | 'timeout'
}
```

**Sender**: Leaving player (or host on timeout)  
**Receiver**: Host (or new host if host left)  
**Response**: Host updates player list, broadcasts `sync-state`

---

### 4. `start-game` (Host → All)

Host initiates game start.

```typescript
interface StartGamePayload {
  type: 'start-game'
  firstPlayerIndex: number  // Randomly chosen by host
  timestamp: number
}
```

**Sender**: Host only  
**Receivers**: All connected peers  
**Effect**: Each player generates their own card locally

---

### 5. `call-number` (Current Player → Host)

Player calls a number during their turn.

```typescript
interface CallNumberPayload {
  type: 'call-number'
  playerId: string
  number: number  // 1-25
}
```

**Sender**: Current turn player  
**Receiver**: Host  
**Validation**: Host verifies it's sender's turn and number not already called  
**Response**: Host broadcasts `number-called` to all

---

### 6. `number-called` (Host → All)

Confirms a number was called. Broadcast after validating `call-number`.

```typescript
interface NumberCalledPayload {
  type: 'number-called'
  number: number
  calledBy: string  // Player ID who called it
  nextTurnIndex: number
  timestamp: number
}
```

**Sender**: Host only  
**Receivers**: All connected peers  
**Effect**: All players mark the number on their local cards

---

### 7. `declare-winner` (Winner → Host)

Player declares they have achieved BINGO (5 lines).

```typescript
interface DeclareWinnerPayload {
  type: 'declare-winner'
  playerId: string
  completedLineCount: number  // Should be >= 5
  completedLines: LineDefinition[]  // Line coordinates for verification
}
```

**Sender**: Winning player  
**Receiver**: Host  
**Validation**: Host verifies that all claimed lines contain only numbers from `calledNumbers`. Host cannot verify card ownership but can detect impossible claims.  
**Response**: Host broadcasts `game-over` if valid, `error` if claim is impossible

---

### 8. `game-over` (Host → All)

Announces game completion.

```typescript
interface GameOverPayload {
  type: 'game-over'
  winnerId: string | null  // Null if draw
  reason: 'winner' | 'draw' | 'forfeit'
  timestamp: number
}
```

**Sender**: Host only  
**Receivers**: All connected peers

---

### 9. `ping` / `pong` (Any → Any)

Connection health check.

```typescript
interface PingPayload {
  type: 'ping'
  timestamp: number
}

interface PongPayload {
  type: 'pong'
  originalTimestamp: number
  respondedAt: number
}
```

**Usage**: Detect disconnections before WebRTC timeout

---

### 10. `host-transfer` (Old Host → New Host)

Notify all peers of host change.

```typescript
interface HostTransferPayload {
  type: 'host-transfer'
  newHostId: string
  reason: 'disconnect' | 'manual'
}
```

**Sender**: Current host (or highest-order peer if host disconnected)  
**Receivers**: All connected peers

---

## Message Flow Diagrams

### Game Creation & Join

```
Host                    Peer A                  Peer B
  │                       │                       │
  │ ── creates room ──────│                       │
  │                       │                       │
  │ <── player-join ──────│                       │
  │                       │                       │
  │ ── sync-state ──────> │                       │
  │                       │                       │
  │ <─────────────────────────── player-join ─────│
  │                       │                       │
  │ ── sync-state ──────> │ ──────────────────────│
```

### Turn Flow

```
Host                    Current Player          Others
  │                       │                       │
  │ <── call-number ──────│                       │
  │                       │                       │
  │ (validate)            │                       │
  │                       │                       │
  │ ── number-called ───> │ ────────────────────> │
  │                       │                       │
  │  (each marks locally) │                       │
```

### Win Declaration

```
Host                    Winner                  Others
  │                       │                       │
  │ <── declare-winner ───│                       │
  │                       │                       │
  │ ── game-over ───────> │ ────────────────────> │
```

---

## Error Handling

### Invalid Message Response

```typescript
interface ErrorPayload {
  type: 'error'
  code: 'INVALID_TURN' | 'NUMBER_ALREADY_CALLED' | 'GAME_FULL' | 'NOT_HOST'
  message: string
  originalAction: string
}
```

**Sender**: Host (or any peer detecting invalid message)  
**Receiver**: Message sender

---

## TypeScript Type Definitions

```typescript
// Union type for all messages
type GameMessage =
  | SyncStatePayload
  | PlayerJoinPayload
  | PlayerLeavePayload
  | StartGamePayload
  | CallNumberPayload
  | NumberCalledPayload
  | DeclareWinnerPayload
  | GameOverPayload
  | PingPayload
  | PongPayload
  | HostTransferPayload
  | ErrorPayload

// Action names for Trystero
const ACTIONS = {
  SYNC_STATE: 'sync-state',
  PLAYER_JOIN: 'player-join',
  PLAYER_LEAVE: 'player-leave',
  START_GAME: 'start-game',
  CALL_NUMBER: 'call-number',
  NUMBER_CALLED: 'number-called',
  DECLARE_WINNER: 'declare-winner',
  GAME_OVER: 'game-over',
  PING: 'ping',
  PONG: 'pong',
  HOST_TRANSFER: 'host-transfer',
  ERROR: 'error',
} as const
```

# Multiplayer P2P Documentation

Comprehensive guide to the peer-to-peer multiplayer system in Gametime Bingo.

## 🌐 Overview

Gametime Bingo uses **WebRTC** for peer-to-peer (P2P) multiplayer networking, eliminating the need for a central game server. All game state is synchronized directly between players' browsers.

### Key Features

- **Zero server costs**: No backend infrastructure needed
- **Low latency**: Direct peer-to-peer connections
- **Privacy**: Game data never leaves players' browsers
- **Scalability**: Each game is independent
- **Simplicity**: No server-side code to maintain

## 🛠️ Technology Stack

### Trystero

**What**: Lightweight P2P library (~7KB gzipped)  
**Why**: Simplifies WebRTC with minimal API  
**Docs**: https://github.com/dmotz/trystero

### WebRTC

**What**: Browser API for peer-to-peer communication  
**How**: Creates direct DataChannel connections between browsers  
**Support**: All modern browsers (Chrome, Firefox, Safari, Edge)

### BitTorrent Trackers

**What**: WebSocket servers that help peers discover each other  
**Why**: Public, reliable, no setup required  
**Used trackers**:
```typescript
const TRACKER_URLS = [
  'wss://tracker.webtorrent.dev',
  'wss://tracker.openwebtorrent.com', 
  'wss://tracker.btorrent.xyz',
];
```

## 🏛️ Architecture

### Host-Authority Pattern

One player (the **host**) has authoritative control:

```
┌─────────────────┐
│   Host Player   │
│  (Authority)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Player2│ │Player3│
│(Guest)│ │(Guest)│
└───────┘ └───────┘
```

**Host responsibilities**:
- Validate player actions (turns, number calls)
- Broadcast game state updates
- Detect win conditions
- Manage player joins/leaves

**Guest responsibilities**:
- Send action requests to host
- Update local state from host broadcasts
- Detect local line completions
- Report BINGO to host

### State Distribution

| State | Synced? | Authority | Storage |
|-------|---------|-----------|---------|
| Game session | ✅ Yes | Host | All players |
| Player list | ✅ Yes | Host | All players |
| Called numbers | ✅ Yes | Host | All players |
| Current turn | ✅ Yes | Host | All players |
| Player's card | ❌ No | Local | Local only |
| Completed lines | ❌ No | Local | Local only |

**Why cards aren't synced**:
- **Privacy**: Players can't cheat by seeing others' cards
- **Bandwidth**: Reduces network traffic
- **Fairness**: Prevents strategic exploitation

## 📡 Message Protocol

### Message Types

All messages are JSON-serialized and use discriminated unions:

```typescript
type MessagePayload = 
  | SyncStatePayload      // Host → All: Full state sync
  | PlayerJoinPayload     // Player → Host: Join request
  | PlayerLeavePayload    // Player → Host: Leave notification
  | StartGamePayload      // Host → All: Game start
  | CallNumberPayload     // Player → Host: Call number
  | NumberCalledPayload   // Host → All: Number called
  | BingoPayload          // Player → Host: Claim BINGO
  | GameOverPayload;      // Host → All: Game end
```

### Connection Flow

```
Player opens game URL
  ↓
Join Trystero room (room ID from URL)
  ↓
Wait for peer connection
  ↓
Send "player-join" to host
  ↓
Host validates and adds player
  ↓
Host broadcasts "sync-state" to all
  ↓
Player receives session state
  ↓
Player sees lobby with all players
```

### Gameplay Flow

```
Player's turn
  ↓
Player selects number
  ↓
Send "call-number" to host
  ↓
Host validates (correct turn, valid number)
  ↓
Host updates session (calledNumbers, turn)
  ↓
Host broadcasts "number-called" to all
  ↓
All players mark their cards locally
  ↓
If 5 lines completed:
  ↓
  Send "bingo" to host
  ↓
  Host validates win
  ↓
  Host broadcasts "game-over"
```

## 🔌 Connection Management

### Establishing Connections

**Critical timing issue**: WebRTC connections are asynchronous!

**❌ DON'T**: Send immediately after joining
```typescript
joinRoom(roomCode);
sendPlayerJoin(playerId, playerName); // May fail!
```

**✅ DO**: Wait for peer connection
```typescript
joinRoom(roomCode);

// Option 1: Wait for peer connection callback
onPeerJoin((peerId) => {
  sendPlayerJoin(playerId, playerName); // Safe!
});

// Option 2: Check for existing peers (race condition)
const connectedPeers = getConnectedPeers();
if (connectedPeers.length > 0) {
  sendPlayerJoin(playerId, playerName);
}
```

### Peer Discovery Lifecycle

**During lobby**: Trackers continuously help new players connect

**During game**: Stop tracker reconnection to reduce noise

```typescript
import { pauseRelayReconnection, resumeRelayReconnection } from 'trystero/torrent';

// When game starts
export function stopPeerDiscovery(): void {
  pauseRelayReconnection();
}

// When returning to lobby
export function resumePeerDiscovery(): void {
  resumeRelayReconnection();
}
```

### Disconnection Handling

**Temporary disconnect** (<30 seconds):
- Player marked as "reconnecting"
- Turn is skipped with grace period
- Player can rejoin and continue

**Permanent disconnect**:
- Player removed from session
- Game continues with remaining players
- If host disconnects, new host elected

**Reconnection**:
```typescript
// Player rejoins same room
joinRoom(roomCode);

// Host detects returning player (by ID)
if (existingPlayer) {
  // Update connection status
  updatePlayerStatus(playerId, 'connected');
} else {
  // New player
  addPlayer(playerId, playerName);
}

// Broadcast updated state
broadcastSyncState();
```

## 🔒 Security & Validation

### Input Validation

**All P2P messages are validated**:

```typescript
// Type guards ensure message structure
export function isCallNumber(msg: MessagePayload): msg is CallNumberPayload {
  return (
    msg.type === 'call-number' &&
    typeof msg.playerId === 'string' &&
    typeof msg.number === 'number'
  );
}

// Validate message content
function handleCallNumber(payload: CallNumberPayload): void {
  // Validate it's the player's turn
  if (!isPlayersTurn(session, payload.playerId)) {
    console.warn('Not player\'s turn');
    return;
  }
  
  // Validate number range
  if (!isValidNumber(payload.number)) {
    console.warn('Invalid number:', payload.number);
    return;
  }
  
  // Validate not already called
  if (session.calledNumbers.includes(payload.number)) {
    console.warn('Number already called');
    return;
  }
  
  // Process valid message
  processCallNumber(payload);
}
```

### Host Authority

**Why host authority?**
- Prevents cheating (no consensus needed)
- Simplifies synchronization
- Reduces network overhead
- Clear conflict resolution

**Host validation**:
```typescript
// Host validates all actions
if (playerId !== session.players[session.currentTurnIndex].id) {
  return; // Not your turn
}

if (session.calledNumbers.includes(number)) {
  return; // Already called
}

// Valid - proceed
```

## 🐛 Debugging P2P Issues

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Players can't connect | Trackers down | Check console for tracker errors |
| "player-join" not received | Sent before WebRTC ready | Wait for `onPeerJoin` callback |
| Host UI not updating | Only updating `hostSession` | Call `gameStore.setSession()` |
| Turn validation fails | Turn index out of sync | Verify turn advances consistently |
| Repeated tracker reconnection | Game still discovering peers | Call `stopPeerDiscovery()` when game starts |

### Debug Logging

Add temporary logs:

```typescript
// In network layer (remove before committing!)
console.log('[P2P] Sending:', payload);
console.log('[P2P] Received:', payload);
console.log('[P2P] Peers:', getConnectedPeers());
```

### Browser DevTools

**Check WebRTC connections**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: `WS` (WebSocket)
4. Look for tracker connections

**Check console errors**:
- Red errors indicate failures
- Yellow warnings often indicate normal tracker fallbacks

### Testing P2P Locally

**Multi-window testing**:
```bash
# Start dev server
npm run dev

# Open multiple browser windows:
# - Window 1 (Host): http://localhost:5173
# - Window 2 (Guest): Copy room URL from window 1
# - Window 3 (Guest): Copy room URL from window 1
```

**Multi-device testing**:
```bash
# Expose to network
npm run dev -- --host

# Note the network URL (e.g., http://192.168.1.100:5173)
# Open on other devices (phone, tablet, other computer)
```

## ⚡ Performance Optimization

### Message Size

**Keep payloads small**:

```typescript
// ✅ DO: Minimal payload
interface NumberCalledPayload {
  type: 'num-called';
  number: number;
  calledBy: string;
  nextTurnIndex: number;
  timestamp: number;
}

// ❌ DON'T: Include unnecessary data
interface NumberCalledPayload {
  type: 'num-called';
  number: number;
  calledBy: string;
  session: GameSession; // ❌ Too large!
  allCards: BingoCard[]; // ❌ Never send cards!
}
```

### State Synchronization

**Use delta updates**:

```typescript
// ✅ DO: Send only what changed
broadcastNumberCalled(number, playerId, turnIndex);

// ❌ DON'T: Send full state for every action
broadcastSyncState(session); // Too heavy for frequent updates
```

**When to use full sync**:
- Player joins (needs initial state)
- Player reconnects (may be outdated)
- Detected desync (recovery)

### Connection Pooling

Trystero automatically manages connections - no manual pooling needed.

## 🧪 Testing P2P

### Unit Testing

**Mock Trystero**:
```typescript
import { vi } from 'vitest';

vi.mock('trystero', () => ({
  joinRoom: vi.fn(() => ({
    makeAction: vi.fn(() => [vi.fn(), vi.fn()]),
    leave: vi.fn(),
    getPeers: vi.fn(() => ({})),
  })),
}));
```

**Test message validation**:
```typescript
import { isCallNumber } from '$lib/network/messages';

describe('isCallNumber', () => {
  it('should accept valid message', () => {
    const msg = { type: 'call-number', playerId: '123', number: 5 };
    expect(isCallNumber(msg)).toBe(true);
  });
  
  it('should reject invalid number', () => {
    const msg = { type: 'call-number', playerId: '123', number: 26 };
    expect(isCallNumber(msg)).toBe(false);
  });
});
```

### E2E Testing

**Multi-player scenario**:
```typescript
import { test, expect } from '@playwright/test';

test('two players can play together', async ({ browser }) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  
  const hostPage = await host.newPage();
  const guestPage = await guest.newPage();
  
  // Host creates game
  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: /create/i }).click();
  const roomUrl = hostPage.url();
  
  // Guest joins
  await guestPage.goto(roomUrl);
  
  // Verify connection
  await expect(hostPage.getByText(/2 players/i)).toBeVisible();
  await expect(guestPage.getByText(/2 players/i)).toBeVisible();
  
  await host.close();
  await guest.close();
});
```

## 📚 API Reference

### Room Management

```typescript
import { joinRoom } from 'trystero/torrent';

// Join a room
const room = joinRoom(
  { appId: 'gametime-bingo', relayUrls: TRACKER_URLS },
  roomCode
);

// Create an action (typed message)
const [sendMessage, onMessage] = room.makeAction<MessagePayload>('game');

// Send message
sendMessage(payload);

// Receive messages
onMessage((payload, peerId) => {
  console.log('Received from', peerId, ':', payload);
});

// Get connected peers
const peers = room.getPeers();

// Leave room
room.leave();
```

### Connection Events

```typescript
// Peer joined
room.onPeerJoin((peerId) => {
  console.log('Peer joined:', peerId);
});

// Peer left
room.onPeerLeave((peerId) => {
  console.log('Peer left:', peerId);
});
```

## 🔮 Future Enhancements

Potential P2P improvements:

- **Voice chat**: Add audio streams via WebRTC
- **Spectator mode**: Read-only connections
- **Replay system**: Record and replay games
- **Custom tracker**: Self-hosted tracker for reliability
- **TURN server**: Better NAT traversal

## 📖 Further Reading

- [Trystero Documentation](https://github.com/dmotz/trystero)
- [WebRTC Basics](https://webrtc.org/getting-started/overview)
- [P2P Protocol Spec](../../specs/001-bingo-game/contracts/p2p-protocol.md)
- [Network Layer API](../api/network.md)
- [Architecture Overview](../architecture.md)

---

**Questions?** [Open an issue](https://github.com/amitjoshi-ms/gametime-bingo/issues) or check [GitHub Discussions](https://github.com/amitjoshi-ms/gametime-bingo/discussions).

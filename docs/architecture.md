# Architecture Overview

This document describes the system architecture, design decisions, and technical implementation of Gametime Bingo.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Svelte 5 App                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Components  │  │   Stores    │  │  Game Logic │  │  │
│  │  │   (UI)      │◄─┤ (State Mgmt)│◄─┤  (Pure Fn)  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │         │               │                  │          │  │
│  │         └───────────────┼──────────────────┘          │  │
│  │                         ▼                             │  │
│  │                  ┌─────────────┐                      │  │
│  │                  │   Network   │                      │  │
│  │                  │    Layer    │                      │  │
│  │                  └──────┬──────┘                      │  │
│  └─────────────────────────┼────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                        │
│                    │   Trystero   │                        │
│                    │  (WebRTC)    │                        │
│                    └───────┬──────┘                        │
└────────────────────────────┼───────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
           ┌──────▼──────┐      ┌──────▼──────┐
           │   Tracker   │      │   Tracker   │
           │  Server 1   │      │  Server 2   │
           │(WebTorrent) │      │(WebTorrent) │
           └─────────────┘      └─────────────┘
                  │                     │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Other Players'    │
                  │   Browser Clients   │
                  └─────────────────────┘
```

### Architecture Layers

#### 1. **UI Layer** (`src/components/`)
- **Svelte 5 Components**: Modern reactive UI with runes
- **Responsibilities**: Rendering, user interactions, visual feedback
- **State Source**: Svelte stores (reactive subscriptions)
- **Pure Presentation**: No business logic or network code

#### 2. **State Management** (`src/lib/stores/`)
- **Svelte Stores**: Reactive state with `$state`, `$derived`, `$effect`
- **Files**:
  - `game.svelte.ts`: Game session state
  - `player.svelte.ts`: Local player state
- **Responsibilities**: 
  - Coordinate between UI, game logic, and network
  - Manage derived state
  - Handle side effects (localStorage, network events)

#### 3. **Game Logic** (`src/lib/game/`)
- **Pure Functions**: No side effects, fully testable
- **Files**:
  - `card.ts`: Card generation, marking, line detection
  - `session.ts`: Session management, player management
  - `validation.ts`: Input validation, game rules
  - `types.ts`: TypeScript type definitions
  - `lines.ts`: Line definitions (horizontal, vertical, diagonal)
- **Responsibilities**:
  - Core game rules
  - State transformations
  - Validation logic

#### 4. **Network Layer** (`src/lib/network/`)
- **Trystero Integration**: WebRTC P2P communication
- **Files**:
  - `room.ts`: Room connection management
  - `messages.ts`: Message type definitions and validation
  - `host.ts`: Host-specific logic (state broadcast)
  - `sync.ts`: State synchronization utilities
- **Responsibilities**:
  - P2P connection management
  - Message serialization/deserialization
  - Network error handling

## 🎯 Design Decisions

### P2P Architecture (No Backend Server)

**Decision**: Use WebRTC peer-to-peer networking instead of a traditional client-server architecture.

**Rationale**:
- **Zero hosting costs**: No backend servers to maintain
- **Low latency**: Direct peer connections
- **Scalability**: Each game is independent
- **Privacy**: Game state never leaves players' browsers
- **Simplicity**: No server infrastructure needed

**Trade-offs**:
- Host player has additional responsibilities
- More complex connection logic
- Requires WebRTC-compatible browsers
- NAT traversal challenges (mitigated by STUN/TURN)

### Svelte 5 with Runes

**Decision**: Use Svelte 5's new runes API (`$state`, `$derived`, `$effect`) instead of legacy reactive declarations.

**Rationale**:
- **Explicit reactivity**: Clear what is reactive vs static
- **Better performance**: Finer-grained reactivity
- **TypeScript support**: Better type inference
- **Modern patterns**: Aligns with React hooks, Vue Composition API

**Example**:
```typescript
// Legacy (Svelte 3/4)
let count = 0;
$: doubled = count * 2;

// Modern (Svelte 5)
let count = $state(0);
let doubled = $derived(count * 2);
```

### Pure Game Logic

**Decision**: Keep all game logic in pure functions (`lib/game/`) with no side effects.

**Rationale**:
- **Testability**: Easy to unit test without mocking
- **Predictability**: Same inputs always produce same outputs
- **Reusability**: Logic can be used in any context
- **Debugging**: Easier to reason about state changes

**Example**:
```typescript
// ✅ Pure function
function markNumber(card: BingoCard, number: number): BingoCard {
  return {
    ...card,
    marked: card.marked.map((row, i) =>
      row.map((marked, j) => marked || card.grid[i][j] === number)
    )
  };
}

// ❌ Impure function (mutates input)
function markNumber(card: BingoCard, number: number): void {
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (card.grid[i][j] === number) {
        card.marked[i][j] = true;
      }
    }
  }
}
```

### Host-Authority Pattern

**Decision**: Designate one player as "host" who manages authoritative game state.

**Rationale**:
- **Consistency**: Single source of truth prevents desyncs
- **Conflict resolution**: Host decisions are final
- **Simpler sync**: Broadcast pattern instead of consensus
- **Turn validation**: Host enforces game rules

**Host Responsibilities**:
- Validate player actions (turns, number calls)
- Broadcast game state updates
- Detect win conditions
- Handle player joins/leaves

**Host Migration**:
- If host disconnects, oldest remaining player becomes new host
- Seamless transition using Trystero's peer tracking

### Private Cards

**Decision**: Each player's card is never transmitted over the network.

**Rationale**:
- **Privacy**: Players can't cheat by seeing others' cards
- **Fairness**: Prevents strategic exploitation
- **Bandwidth**: Reduces network traffic
- **Simplicity**: Less state to synchronize

**Implementation**:
- Cards generated locally with seeded random (player ID as seed)
- Only called numbers are synced
- Players mark their own cards based on called numbers
- Win condition detected locally, validated by host

### BitTorrent Tracker Strategy

**Decision**: Use Trystero's BitTorrent/WebTorrent strategy instead of Nostr or Firebase.

**Rationale**:
- **Reliability**: Well-established public WebTorrent trackers
- **No setup**: No need to configure relay servers
- **Redundancy**: Multiple trackers provide fallback
- **Open source**: No vendor lock-in

**Trackers Used**:
```typescript
const TRACKER_URLS = [
  'wss://tracker.webtorrent.dev',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
];
```

### Date-Based Versioning

**Decision**: Use `YY.MDD.REV` version format instead of semantic versioning.

**Rationale**:
- **Auto-calculated**: No manual version bumping
- **Date context**: Instantly know when a release was made
- **Simplicity**: No need to debate major vs minor vs patch

**Example**: `26.116.0` = 2026, January 16th, revision 0

## 🔄 Data Flow

### Game Creation Flow

```
User clicks "Create Game"
  ↓
Player store generates local player ID
  ↓
Game store creates session with player as host
  ↓
Network layer joins Trystero room (room ID = session ID)
  ↓
UI shows lobby with shareable room code
```

### Player Join Flow

```
User enters room code and name
  ↓
Player store generates local player ID
  ↓
Network layer joins Trystero room
  ↓
Send "player-join" message to host
  ↓
Host adds player to session
  ↓
Host broadcasts "sync-state" to all players
  ↓
Game store updates with new session state
  ↓
UI shows lobby with all players
```

### Turn Flow

```
Player's turn → UI enables number pad
  ↓
Player selects number → Validation (not called before)
  ↓
Send "call-number" to host
  ↓
Host validates (correct turn, valid number)
  ↓
Host updates session (add to calledNumbers, advance turn)
  ↓
Host broadcasts "number-called" to all players
  ↓
Each player's game store receives message
  ↓
Local card is marked, lines detected
  ↓
If 5 lines completed → Send "bingo" to host
  ↓
Host validates win → Broadcast "game-over" to all
```

## 🗄️ State Management

### State Distribution

| State | Location | Synced? | Authority |
|-------|----------|---------|-----------|
| Game session | `game.svelte.ts` | ✅ Yes | Host |
| Player list | `game.svelte.ts` | ✅ Yes | Host |
| Called numbers | `game.svelte.ts` | ✅ Yes | Host |
| Current turn | `game.svelte.ts` | ✅ Yes | Host |
| Local player | `player.svelte.ts` | ❌ No | Local |
| Player's card | `player.svelte.ts` | ❌ No | Local |
| Completed lines | Derived locally | ❌ No | Local |
| B-I-N-G-O progress | Derived locally | ❌ No | Local |

### Persistence

**localStorage** is used for:
- Player ID (persistent across sessions)
- Player name (convenience)
- Current game session (reconnection)

**Not persisted**:
- Full game history
- Chat messages (not implemented)
- Player statistics (not implemented)

## 🔒 Security Considerations

### Input Validation

All user inputs and P2P messages are validated:

```typescript
// Validate player name
export function isValidPlayerName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_NAME_LENGTH;
}

// Validate called number
export function isValidNumber(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= TOTAL_NUMBERS;
}

// Validate turn
export function isPlayersTurn(session: GameSession, playerId: string): boolean {
  return session.players[session.currentTurnIndex]?.id === playerId;
}
```

### Message Validation

All P2P messages use TypeScript type guards:

```typescript
export function isCallNumber(msg: MessagePayload): msg is CallNumberPayload {
  return (
    msg.type === 'call-number' &&
    typeof msg.playerId === 'string' &&
    typeof msg.number === 'number'
  );
}
```

### Privacy

- Player cards are never transmitted
- No sensitive data stored
- No tracking or analytics
- No third-party dependencies (except Trystero trackers)

## 🧪 Testing Strategy

### Unit Tests (Vitest)

Test pure game logic in isolation:
- Card generation and marking
- Line detection
- Session management
- Validation functions

**Coverage target**: >80% for `lib/game/`

### E2E Tests (Playwright)

Test full user flows:
- Create and join games
- Turn-based gameplay
- Win conditions
- Connection handling

**Key scenarios**: All user stories from spec

### Integration Tests

Test P2P message handling:
- Message serialization/deserialization
- Host state updates
- State synchronization

## 📦 Build & Deployment

### Build Pipeline

```
npm run build
  ↓
Vite bundles app
  ↓
TypeScript compilation (tsc)
  ↓
Svelte compilation (to JS)
  ↓
Tree shaking & minification
  ↓
Output to dist/
```

### Deployment (Cloudflare Pages)

```
GitHub release branch updated
  ↓
Cloudflare Pages detects change
  ↓
Automatic build triggered
  ↓
Deploy to edge network
  ↓
Live at gametime-bingo.pages.dev
```

**Zero-config deployment**:
- Build command: `npm run build`
- Output directory: `dist/`
- Framework: Vite (auto-detected)

## 🔮 Future Enhancements

Potential architecture changes for future features:

### Persistent Rooms
- Optional backend for 24/7 room availability
- Redis for session persistence
- WebSocket fallback for connectivity

### Spectator Mode
- Read-only P2P connections
- No turn participation
- See all cards (optional)

### Replay System
- Event sourcing pattern
- Store all game events
- Replay from any point

### Chat System
- Additional Trystero action for chat messages
- Message history in localStorage
- Emoji support

## 📚 Further Reading

- [Multiplayer P2P Documentation](./features/multiplayer.md)
- [Game Logic API](./api/game-logic.md)
- [Network Layer API](./api/network.md)
- [Svelte 5 Runes Guide](https://svelte-5-preview.vercel.app/docs/runes)
- [Trystero Documentation](https://github.com/dmotz/trystero)

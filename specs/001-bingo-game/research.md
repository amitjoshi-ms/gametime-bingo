# Research: Multiplayer BINGO Game

**Feature**: 001-bingo-game  
**Date**: 2026-01-13  
**Purpose**: Resolve technology decisions and unknowns from Technical Context

## Research Questions

### 1. P2P/WebRTC Library Selection

**Question**: Which WebRTC library enables P2P multiplayer in a static SPA without a backend server?

**Decision**: **Trystero** with Nostr signaling strategy

**Rationale**:
- **Truly serverless**: Uses public Nostr relays for signaling—no backend required
- **Smallest size**: ~7KB gzipped (Nostr strategy) vs. PeerJS at 31KB
- **Room-based matchmaking**: Built-in room codes via `joinRoom(config, roomCode)`
- **Automatic reconnection**: Handles peer disconnects gracefully
- **Production-ready**: MIT licensed, used by Chitchatter and other production apps
- **End-to-end encrypted**: Secure after WebRTC connection established

**Alternatives Considered**:

| Library | Size (gzip) | Why Rejected |
|---------|-------------|--------------|
| PeerJS | 31 KB | Requires dedicated signaling server for production |
| simple-peer | 17 KB | No signaling included—need to build custom solution |
| Y.js + y-webrtc | ~65 KB | Overkill (CRDT); still needs signaling server |

**Final Choice for Technical Context**: Trystero with Nostr strategy (~7KB gzipped)

**Key Implementation Details**:
```typescript
import { joinRoom } from 'trystero/nostr'

const room = joinRoom({ appId: 'gametime-bingo' }, 'ROOM-CODE')
room.onPeerJoin(peerId => ...)
room.onPeerLeave(peerId => ...)
const [sendMessage, onMessage] = room.makeAction('message')
```

---

### 2. UI Framework Selection

**Question**: Which framework provides the best balance of size, DX, and testability?

**Decision**: **Svelte 5** (v5.46.x)

**Rationale**:
- **Smallest runtime**: ~3-5KB gzipped (compiler-based, no VDOM)
- **MIT Licensed**: Fully permissive ✅
- **Excellent DX**: Single-file components, built-in reactivity (runes)
- **Testing support**: First-class Vitest support, @testing-library/svelte compatible
- **Performance**: Compiles to vanilla JS—optimal for 60fps animations

**Alternatives Considered**:

| Framework | Size (gzip) | Why Rejected |
|-----------|-------------|--------------|
| React | ~40 KB | Too heavy for budget |
| Preact | ~4 KB | Good alternative, but Svelte's DX is superior |
| Vue | ~30 KB | Too heavy; more complex reactivity |
| Vanilla JS | 0 KB | Loses productivity; manual DOM management |

---

### 3. Session Code Implementation

**Question**: How do players join a room using just a short code without a backend?

**Decision**: Generate random alphanumeric codes; Trystero handles matchmaking via Nostr relays

**Rationale**:
- Trystero's `joinRoom(config, roomId)` uses `roomId` as the matchmaking key
- Players with the same `appId` + `roomId` automatically discover each other
- Public Nostr relays handle the signaling—no backend needed

**Implementation**:
```typescript
// Generate 6-character room code using Web Crypto API for security
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const randomValues = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(randomValues, v => chars[v % chars.length]).join('')
}

// Host creates room
const roomCode = generateRoomCode()
const room = joinRoom({ appId: 'gametime-bingo' }, roomCode)

// Other players join with the same code
const room = joinRoom({ appId: 'gametime-bingo' }, enteredCode)
```

**Sharing**: Players share codes via external means (text, chat apps)—URL query param `?room=ABC123` also supported.

---

### 4. Game State Synchronization Architecture

**Question**: How to maintain consistent game state across all peers in P2P?

**Decision**: **Host-authoritative** model with optimistic local updates

**Rationale**:
- One player (the host) is the source of truth for shared state
- Simplifies conflict resolution vs. CRDT/consensus approaches
- Host broadcasts state changes; other players apply them
- If host disconnects, another player becomes host (automatic promotion)

**State Ownership**:

| State | Owned By | Synced Via |
|-------|----------|------------|
| Called numbers | Host | Broadcast to all peers |
| Current turn index | Host | Broadcast to all peers |
| Game status | Host | Broadcast to all peers |
| Player list | Host | Broadcast to all peers |
| Player's own card | Each player locally | Not synced (private) |
| Player's own progress | Each player locally | Not synced (private) |

**Privacy**: Each player generates their own card locally using a seeded PRNG. Cards are never transmitted over the network—only called numbers are shared.

---

### 5. Network Resilience Strategy

**Question**: How to handle disconnections without disrupting gameplay?

**Decision**: Local state caching + automatic reconnection + timeout-based turn skipping

**Implementation**:
1. **localStorage persistence**: Save game state on every change
2. **Trystero auto-reconnect**: Built-in reconnection handling
3. **Turn timeout**: 30-second timer; if current player is disconnected, skip to next
4. **State recovery**: On reconnect, player receives full state from host
5. **Host failover**: If host disconnects, highest-order connected peer becomes new host

---

### 6. Bundle Size Budget Analysis

**Question**: Can we fit within the 100KB JS gzipped budget?

**Decision**: Yes, with significant headroom

**Breakdown**:

| Component | Estimated Size (gzip) |
|-----------|-----------------------|
| Svelte 5 runtime | ~4 KB |
| Trystero (Nostr) | ~7 KB |
| Game logic | ~10 KB |
| UI components | ~15 KB |
| Utilities | ~5 KB |
| **Total** | **~41 KB** |

**Remaining budget**: ~59 KB for growth, polyfills, or additional features.

---

## Dependency License & Trust Summary

| Dependency | Version | License | Weekly Downloads | GitHub Stars | Trust Level |
|------------|---------|---------|------------------|--------------|-------------|
| Svelte | 5.46.x | MIT | 800K+ | 85K+ | ⭐⭐⭐⭐⭐ |
| Trystero | 0.22.x | MIT | 4K+ | 4K+ | ⭐⭐⭐⭐ |
| Vite | 6.x | MIT | 15M+ | 70K+ | ⭐⭐⭐⭐⭐ |
| Vitest | 2.x | MIT | 8M+ | 14K+ | ⭐⭐⭐⭐⭐ |
| Playwright | 1.x | Apache-2.0 | 6M+ | 70K+ | ⭐⭐⭐⭐⭐ |

**All dependencies are MIT or Apache-2.0 licensed—fully permissive for any use.**

---

## Outstanding Questions

None—all NEEDS CLARIFICATION items resolved.

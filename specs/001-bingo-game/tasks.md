# Tasks: Multiplayer BINGO Game

**Input**: Design documents from `/specs/001-bingo-game/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/p2p-protocol.md ✅

**Tests**: Not explicitly requested in specification. Test tasks omitted.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4, US5) - Setup/Foundational phases have no story label

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Svelte 5 + Trystero stack

- [x] T001 Initialize Svelte 5 project with Vite in repository root: `pnpm create vite@latest . --template svelte-ts`
- [x] T002 Install dependencies: `pnpm add trystero svelte@^5`
- [x] T003 Install dev dependencies: `pnpm add -D vitest @testing-library/svelte playwright @sveltejs/vite-plugin-svelte typescript @types/node`
- [x] T004 [P] Configure tsconfig.json with strict mode per plan.md
- [x] T005 [P] Configure vite.config.ts with Svelte plugin
- [x] T006 [P] Configure eslint.config.js and .prettierrc
- [x] T007 [P] Configure playwright.config.ts for E2E tests
- [x] T008 Create directory structure per plan.md: src/lib/game/, src/lib/network/, src/lib/stores/, src/lib/utils/, src/components/, tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can start

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Type Definitions

- [x] T009 [P] Define TypeScript types in src/lib/game/types.ts: GameStatus, ConnectionStatus, LineType, LineDefinition, Player, BingoCard, GameSession
- [x] T010 [P] Define message payload types in src/lib/network/messages.ts: all 12 P2P message interfaces from contracts/p2p-protocol.md

### Pure Game Logic (Unit-Testable)

- [x] T011 [P] Implement card generation in src/lib/game/card.ts: generateCard(), createEmptyMarked(), shuffleArray()
- [x] T012 [P] Implement line detection in src/lib/game/lines.ts: LINES constant, findCompletedLines(), getNewlyCompletedLines()
- [x] T013 [P] Implement validation helpers in src/lib/game/validation.ts: isValidNumber(), isNumberCalled(), canCallNumber()
- [x] T014 Implement session state management in src/lib/game/session.ts: createSession(), addPlayer(), removePlayer(), canStartGame(), callNumber(), advanceTurn(), checkForWinner()

### Utilities

- [x] T015 [P] Implement localStorage helpers in src/lib/utils/storage.ts: saveState(), loadState(), clearState() with PersistedState interface
- [x] T016 [P] Implement secure room code generator in src/lib/utils/random.ts: generateRoomCode() using Web Crypto API

### Svelte Stores

- [x] T017 Implement game session store in src/lib/stores/game.svelte.ts: reactive state for GameSession, derived computed values
- [x] T018 Implement local player store in src/lib/stores/player.svelte.ts: player ID, name, card, completed lines (private data)

### Network Layer Foundation

- [x] T019 Implement Trystero room management in src/lib/network/room.ts: createRoom(), joinRoom(), leaveRoom(), room lifecycle
- [x] T020 Implement message actions in src/lib/network/host.ts: host-specific message handlers (player-join, call-number, declare-winner)
- [x] T021 Implement state sync in src/lib/network/sync.ts: sendSyncState(), onSyncState(), delta message handlers

### Base UI Components

- [x] T022 [P] Create Button.svelte in src/components/ui/Button.svelte with accessible touch targets (≥48px)
- [x] T023 [P] Create Input.svelte in src/components/ui/Input.svelte for text input with validation
- [x] T024 [P] Create Modal.svelte in src/components/ui/Modal.svelte for dialogs

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Join Game Session (Priority: P1) 🎯 MVP

**Goal**: Players can create sessions, share codes, and join games (2-5 players)

**Independent Test**: Create session → share code → second player joins → verify both see lobby

### Implementation for User Story 1

- [x] T025 [P] [US1] Create Lobby.svelte in src/components/Lobby.svelte: display room code, player list, Start Game button
- [x] T026 [P] [US1] Create PlayerList.svelte in src/components/PlayerList.svelte: show player names and connection status
- [x] T027 [P] [US1] Create ConnectionStatus.svelte in src/components/ConnectionStatus.svelte: network status indicator
- [x] T028 [US1] Implement create game flow in src/lib/network/room.ts: generateRoomCode(), create Trystero room, become host
- [x] T029 [US1] Implement join game flow in src/lib/network/room.ts: join existing room by code, send player-join message
- [x] T030 [US1] Handle player-join in host.ts: validate player count (max 5), add to session, broadcast sync-state
- [x] T031 [US1] Implement player count validation: minimum 2 to enable Start, maximum 5 with "Game is full" error
- [x] T032 [US1] Create home screen in App.svelte: "Create Game" and "Join Game" buttons, routing to Lobby
- [x] T033 [US1] Add URL query param support: ?room=ABC123 for direct join links

**Checkpoint**: User Story 1 complete - players can create and join sessions

---

## Phase 4: User Story 2 - Play a Turn (Priority: P1)

**Goal**: Players take turns calling numbers (1-25), all cards update in real-time

**Independent Test**: Player A calls number → verify number marked on all players' cards → turn advances

### Implementation for User Story 2

- [x] T034 [P] [US2] Create Cell.svelte in src/components/Cell.svelte: single card cell with marked/unmarked states
- [x] T035 [P] [US2] Create Card.svelte in src/components/Card.svelte: 5x5 grid using CSS Grid, displays player's card
- [x] T036 [P] [US2] Create NumberPad.svelte in src/components/NumberPad.svelte: 1-25 number buttons, disable called numbers
- [x] T037 [P] [US2] Create CalledNumbers.svelte in src/components/CalledNumbers.svelte: chronological list of called numbers
- [x] T038 [US2] Create Game.svelte in src/components/Game.svelte: main game screen layout with card, numberpad, players
- [x] T039 [US2] Implement call-number handler in host.ts: validate turn, validate number not called, broadcast number-called
- [x] T040 [US2] Implement number-called handler in sync.ts: update local calledNumbers, mark number on local card
- [x] T041 [US2] Implement markNumber() integration: call markNumber() on player's BingoCard when number-called received
- [x] T042 [US2] Implement turn advancement: advanceTurn() after each number-called, update currentTurnIndex
- [x] T043 [US2] Implement line detection on mark: after marking, run findCompletedLines(), update player progress
- [x] T044 [US2] Add visual feedback for completed lines: highlight cells, animate B-I-N-G-O letter advancement

**Checkpoint**: User Story 2 complete - core gameplay loop works

---

## Phase 5: User Story 3 - Win the Game (Priority: P1)

**Goal**: First player to 5 lines wins, game ends with winner announcement

**Independent Test**: Play until player completes 5 lines → verify winner announcement → game ends

### Implementation for User Story 3

- [x] T045 [P] [US3] Create Progress.svelte in src/components/Progress.svelte: B-I-N-G-O letter tracker (0-5 lines)
- [x] T046 [US3] Implement declare-winner handler in host.ts: validate completed lines against calledNumbers, broadcast game-over
- [x] T047 [US3] Implement automatic win detection: after each mark, check if completedLines.length >= 5, send declare-winner
- [x] T048 [US3] Implement game-over handler in sync.ts: update session status to 'completed', show winner announcement
- [x] T049 [US3] Create GameOver.svelte in src/components/GameOver.svelte: winner announcement, player's own final progress
- [x] T050 [US3] Implement "Play Again" flow: create new session with same players invited (optional re-join)

**Checkpoint**: User Story 3 complete - full game playable from start to finish (MVP COMPLETE!)

---

## Phase 6: User Story 4 - View Game State (Priority: P2)

**Goal**: Players can see their card, progress, called numbers, current turn - but NOT others' cards/progress

**Independent Test**: During active game, verify player sees own card, called numbers, turn indicator, own progress only

### Implementation for User Story 4

- [x] T051 [US4] Ensure Card.svelte only displays current player's card (already local, verify no leakage)
- [x] T052 [US4] Ensure Progress.svelte only shows current player's progress (completedLines from local store)
- [x] T053 [US4] Implement turn indicator in Game.svelte: "Your Turn" / "[Player Name]'s Turn" based on currentTurnIndex
- [x] T054 [US4] Update PlayerList.svelte for in-game: show names and connection status only (no progress/cards)
- [x] T055 [US4] Add accessibility: ARIA labels for turn indicator, progress tracker, card cells

**Checkpoint**: User Story 4 complete - privacy requirements verified

---

## Phase 7: User Story 5 - Handle Disconnections (Priority: P2)

**Goal**: Temporary disconnects handled gracefully, auto-reconnect within 30s, skip after timeout

**Independent Test**: Disconnect player → wait → reconnect within 30s → verify state restored

### Implementation for User Story 5

- [x] T056 [US5] Implement ping/pong heartbeat in src/lib/network/room.ts: detect disconnections
- [x] T057 [US5] Implement connection status updates: track 'connected', 'reconnecting', 'disconnected' per player
- [x] T058 [US5] Implement 30-second turn timeout: if disconnected player's turn, wait 30s then auto-skip
- [x] T059 [US5] Implement auto-reconnect: on reconnect, send player-join, host responds with sync-state
- [x] T060 [US5] Implement session recovery from localStorage: on page reload, attempt rejoin if session active
- [x] T061 [US5] Implement host failover: if host disconnects, promote next player in array to host
- [x] T062 [US5] Show "reconnecting" indicator in PlayerList.svelte for disconnected players

**Checkpoint**: User Story 5 complete - network resilience implemented

**Checkpoint**: User Story 5 complete - network resilience implemented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple stories

- [x] T063 [P] Add global styles in src/app.css: CSS custom properties, responsive breakpoints
- [x] T064 [P] Create favicon.svg in static/favicon.svg
- [x] T065 [P] Create manifest.json in static/manifest.json for PWA support (optional)
- [x] T066 Implement 60fps animations for card marking, line completion, progress advancement
- [x] T067 Ensure touch targets ≥48px on all interactive elements (per constitution)
- [x] T068 Add error boundaries and user-friendly error messages throughout
- [x] T069 Verify bundle size < 100KB gzipped (run `pnpm build` and check)
- [x] T070 Run quickstart.md validation: verify all setup steps work for new developer

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► User Stories (Phase 3-7) ──► Phase 8 (Polish)
                                                      │
                                                      ├── US1 (Create/Join) ◄── MVP Entry
                                                      ├── US2 (Play Turn)
                                                      ├── US3 (Win Game) ◄── MVP Complete
                                                      ├── US4 (View State)
                                                      └── US5 (Disconnections)
```

### User Story Dependencies

| Story | Can Start After | MVP? |
|-------|-----------------|------|
| US1 (Create/Join) | Phase 2 complete | Yes - Entry point |
| US2 (Play Turn) | US1 complete (need session) | Yes - Core loop |
| US3 (Win Game) | US2 complete (need gameplay) | Yes - Conclusion |
| US4 (View State) | US2 complete | No - Enhancement |
| US5 (Disconnections) | US1 complete | No - Resilience |

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
```
T009 Types ─────┬── T011 Card ──┬── T014 Session
T010 Messages ──┤   T012 Lines ─┤
                │   T013 Valid ─┘
T015 Storage ───┤
T016 Random ────┤
                │
T022 Button ────┤
T023 Input ─────┤
T024 Modal ─────┘
```

**Within User Story 1**:
```
T025 Lobby ─────┬── T028 Create ──► T031 Validation
T026 PlayerList─┤   T029 Join ─────┤
T027 ConnStatus─┘                   └──► T032 Home ──► T033 URL
```

**Within User Story 2**:
```
T034 Cell ──────┬── T038 Game ──► T039 Handler ──► T040 Sync
T035 Card ──────┤                              └── T041 Mark
T036 NumberPad ─┤                              └── T042 Turn
T037 CalledNums─┘                              └── T043 Lines
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL)
3. ✅ Complete Phase 3: US1 - Create/Join → **Players can connect**
4. ✅ Complete Phase 4: US2 - Play Turn → **Core gameplay works**
5. ✅ Complete Phase 5: US3 - Win Game → **🎯 MVP COMPLETE**
6. 🚀 Deploy and validate with real users

### Incremental Delivery After MVP

6. Add Phase 6: US4 - View State → Enhanced visibility
7. Add Phase 7: US5 - Disconnections → Network resilience
8. Add Phase 8: Polish → Production-ready

### Estimated Effort

| Phase | Tasks | Parallelizable |
|-------|-------|----------------|
| Setup | 8 | 4 |
| Foundational | 16 | 10 |
| US1 (Create/Join) | 9 | 3 |
| US2 (Play Turn) | 11 | 4 |
| US3 (Win Game) | 6 | 1 |
| US4 (View State) | 5 | 0 |
| US5 (Disconnections) | 7 | 0 |
| Polish | 8 | 4 |
| **Total** | **70** | **26** |

---

## Notes

- All game logic in `src/lib/game/` is pure functions - 100% unit testable
- BingoCard NEVER transmitted over network (privacy by design)
- Host-authoritative model simplifies sync but requires host failover for resilience
- Web Crypto API for room codes (not Math.random)
- Bundle budget: ~41KB estimated, well under 100KB limit

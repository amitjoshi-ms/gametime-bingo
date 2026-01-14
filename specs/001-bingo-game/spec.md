# Feature Specification: Multiplayer BINGO Game

**Feature Branch**: `001-bingo-game`  
**Created**: 2026-01-13  
**Status**: Draft  
**Input**: User description: "Multiplayer BINGO game where players take turns calling numbers to complete lines on their unique 5x5 grids. First player to achieve 5 complete lines (spelling B-I-N-G-O) wins."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Join Game Session (Priority: P1)

A player wants to create a new BINGO game session and invite friends to join, or join an existing session created by another player.

**Why this priority**: Without the ability to create/join sessions, no multiplayer gameplay is possible. This is the foundational entry point for all players.

**Independent Test**: Can be fully tested by creating a session, sharing a join code/link, and having another player join. Delivers the core multiplayer setup capability.

**Acceptance Scenarios**:

1. **Given** a player on the home screen, **When** they tap "Create Game", **Then** a new game session is created and a shareable join code/link is displayed.
2. **Given** a player has a join code/link, **When** they enter/click it, **Then** they are added to the game lobby and can see other players who have joined.
3. **Given** a game lobby with 1 player, **When** a second player joins, **Then** the "Start Game" button becomes enabled (minimum 2 players).
4. **Given** a game lobby with 5 players, **When** another player tries to join, **Then** they receive a "Game is full" message (maximum 5 players).

---

### User Story 2 - Play a Turn (Priority: P1)

During their turn, a player calls a number that all players then mark on their cards, with the system checking for completed lines.

**Why this priority**: This is the core gameplay loop. Without turn-based number calling and marking, there is no game.

**Independent Test**: Can be tested with 2 players taking alternating turns, calling numbers, and seeing marks appear on all cards in real-time.

**Acceptance Scenarios**:

1. **Given** it is Player A's turn, **When** Player A selects number 17, **Then** number 17 is announced to all players and automatically marked on all cards that contain it.
2. **Given** a number has already been called, **When** any player tries to call the same number, **Then** the system prevents the action and shows "Number already called".
3. **Given** Player A calls a number, **When** the number is marked on Player B's card, **Then** Player B sees the cell visually update within 1 second.
4. **Given** a player marks a number that completes a line, **When** the mark is applied, **Then** the completed line is highlighted and the player's B-I-N-G-O progress advances by one letter.

---

### User Story 3 - Win the Game (Priority: P1)

A player wins by being the first to complete 5 unique lines on their card, spelling out B-I-N-G-O.

**Why this priority**: The win condition is essential for game completion. Without it, players have no goal or conclusion.

**Independent Test**: Can be tested by playing through a game until one player completes 5 lines, verifying the winner announcement and game end state.

**Acceptance Scenarios**:

1. **Given** a player has completed 4 lines (B-I-N-G), **When** they complete their 5th line, **Then** they are declared the winner and all players see a "Winner: [Player Name]" announcement.
2. **Given** a winner is declared, **When** the game ends, **Then** all players see a game summary showing their own final progress.
3. **Given** the game has ended, **When** any player taps "Play Again", **Then** a new game session is created with the same players invited.

---

### User Story 4 - View Game State (Priority: P2)

Players can see their own card, their own B-I-N-G-O progress, the list of called numbers, and whose turn it is at any time. Players cannot see other players' cards or progress.

**Why this priority**: Visibility into game state is important for player awareness and strategy, but the game can technically function with minimal UI as long as core mechanics work.

**Independent Test**: Can be tested by having a player view their card, called numbers list, current turn indicator, and their own progress tracker during an active game.

**Acceptance Scenarios**:

1. **Given** an active game, **When** a player views the game screen, **Then** they see their own 5x5 card with marked numbers highlighted.
2. **Given** an active game, **When** a player views the called numbers, **Then** they see a list of all numbers called so far in chronological order.
3. **Given** an active game, **When** a player views their progress, **Then** they see their own B-I-N-G-O progress (0-5 completed lines).
4. **Given** it is Player B's turn, **When** any player views the screen, **Then** the current turn indicator clearly shows "Player B's Turn".
5. **Given** an active game, **When** a player views the game screen, **Then** they cannot see any other player's card or B-I-N-G-O progress.

---

### User Story 5 - Handle Disconnections (Priority: P2)

When a player temporarily loses connection, the game continues and they can rejoin without losing their place.

**Why this priority**: Network resilience is important for user experience but is an enhancement to core gameplay.

**Independent Test**: Can be tested by simulating a player disconnect, continuing the game with other players, then reconnecting and verifying state is restored.

**Acceptance Scenarios**:

1. **Given** a player loses connection, **When** less than 30 seconds pass, **Then** the player can automatically reconnect and see the current game state.
2. **Given** a player is disconnected, **When** it becomes their turn, **Then** the system waits 30 seconds before auto-skipping to the next player.
3. **Given** a player reconnects after being skipped, **When** their turn comes again, **Then** they can play normally.
4. **Given** a player is disconnected, **When** other players view the game, **Then** a "reconnecting" indicator shows next to that player's name.

---

### Edge Cases

- What happens if a player leaves permanently mid-game? Their turn is skipped automatically; remaining players continue.
- What happens if only 1 player remains? That player wins by default.
- What happens when two players complete their 5th line on the same turn? The player whose card appears earlier in the `players` array (reflecting join order) wins; this defines the deterministic processing order.
- What happens if the game host disconnects? Another connected player becomes the host automatically.

## Requirements *(mandatory)*

### Functional Requirements

#### Session Management
- **FR-001**: System MUST allow a player to create a new game session with a unique shareable code/link.
- **FR-002**: System MUST allow players to join an existing session using the code/link.
- **FR-003**: System MUST enforce a minimum of 2 players and maximum of 5 players per session.
- **FR-004**: System MUST allow the session creator to start the game once minimum players have joined.

#### Card Generation
- **FR-005**: System MUST generate a unique 5x5 card for each player containing numbers 1-25 randomly arranged.
- **FR-006**: Each card MUST contain every number from 1-25 exactly once.
- **FR-007**: Cards MUST be generated when the game starts and remain fixed for the duration.

#### Gameplay
- **FR-008**: System MUST randomly select which player takes the first turn.
- **FR-009**: System MUST allow the current player to call any uncalled number (1-25).
- **FR-010**: System MUST prevent calling a number that has already been called.
- **FR-011**: System MUST mark the called number on all players' cards simultaneously.
- **FR-012**: System MUST detect completed lines (horizontal, vertical, diagonal) after each number is marked.
- **FR-013**: System MUST track each player's B-I-N-G-O progress (0-5 completed lines).
- **FR-014**: System MUST advance turn to the next player after each number is called.

#### Win Condition
- **FR-015**: System MUST declare a winner when any player completes 5 unique lines.
- **FR-016**: System MUST end the game when a winner is declared.
- **FR-017**: System MUST display final results showing each player's own progress only.

#### Privacy
- **FR-018**: System MUST NOT reveal other players' cards to any player.
- **FR-019**: System MUST NOT reveal other players' B-I-N-G-O progress to any player.

#### Synchronization
- **FR-020**: System MUST synchronize game state across all connected players in real-time.
- **FR-021**: System MUST handle temporary disconnections (up to 30 seconds) gracefully.
- **FR-022**: System MUST skip disconnected players after 30-second timeout on their turn.

### Key Entities

- **Game Session**: Represents an active game; contains player list, called numbers, current turn, and game status (lobby/in-progress/completed).
- **Player**: A participant in a game; has a unique identifier, display name, connection status, and B-I-N-G-O progress (0-5).
- **Bingo Card**: A player's 5x5 grid; contains 25 cells with numbers 1-25 and tracks which cells are marked.
- **Called Numbers**: The ordered list of numbers that have been called during the game (global to all players).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can create a session and have friends join within 30 seconds.
- **SC-002**: Number calls propagate to all players within 1 second.
- **SC-003**: Game supports 5 concurrent players without noticeable lag or desync.
- **SC-004**: Players complete a full game (from session creation to winner declared) in under 15 minutes.
- **SC-005**: 95% of temporary disconnections (< 30 seconds) result in successful automatic reconnection.
- **SC-006**: Game state remains consistent across all players throughout the session.
- **SC-007**: Players can identify whose turn it is and see their own progress updates without confusion.
- **SC-008**: Players cannot access or infer other players' card contents or progress.

## Assumptions

- Players have modern web browsers with WebRTC support (Chrome, Firefox, Safari, Edge).
- Players will share join codes/links via external means (text, chat apps, etc.).
- Display names are self-assigned by players (no authentication required).
- A game session expires after 1 hour of inactivity.

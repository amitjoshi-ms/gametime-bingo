# Game Modes

Documentation for different game modes in Gametime Bingo.

## 🎮 Available Game Modes

### Multiplayer Mode (Current)

**Status**: ✅ Implemented

**Description**: Turn-based multiplayer BINGO where 2-5 players compete to complete 5 lines first.

**Features**:
- **Player count**: 2-5 players
- **Turn-based**: Players take turns calling numbers
- **Private cards**: Each player has unique card, others can't see it
- **Real-time sync**: P2P WebRTC for instant updates
- **Win condition**: First to complete 5 lines (B-I-N-G-O)

**How to play**:
1. One player creates a game (becomes host)
2. Other players join with room code
3. Host starts game when 2+ players present
4. Players take turns calling numbers
5. First to complete 5 lines wins

See [Gameplay Guide](../gameplay.md) for detailed instructions.

---

## 🚧 Planned Game Modes

The following game modes are under consideration for future implementation:

### Single Player Mode

**Status**: 🔜 Planned

**Description**: Practice mode against AI or random number generation.

**Proposed features**:
- Solo gameplay for learning
- Computer automatically calls numbers
- Adjustable difficulty (speed of number calling)
- No P2P connection required
- Local scoring and statistics

**Implementation notes**:
- Reuse existing game logic
- Add AI number calling strategy
- Simple difficulty: Random with delays
- Advanced difficulty: Strategic number selection

**Use cases**:
- Learning the game
- Testing strategies
- Offline play
- No friends available

---

### Demo Mode

**Status**: 🔜 Planned

**Description**: Automated gameplay demonstration for showcasing the game.

**Proposed features**:
- Auto-play with multiple simulated players
- Visible cards for all players
- Adjustable speed (slow, normal, fast)
- Pause/resume controls
- Perfect for landing page or tutorial

**Implementation notes**:
- Simulate 3-4 players
- Auto-call numbers with delays
- Show all cards simultaneously
- Highlight winning moment

**Use cases**:
- Marketing/demo purposes
- Tutorial walkthrough
- Testing game logic visually

---

### Custom Rules Mode

**Status**: 💡 Idea

**Description**: Customize game rules for variety.

**Potential custom rules**:
- **Win conditions**:
  - Traditional: 5 lines (B-I-N-G-O)
  - Speed: First line wins
  - Marathon: Fill entire card
  - Pattern: Specific shape (X, T, L, etc.)
  
- **Gameplay variants**:
  - Time limits per turn
  - Free space in center
  - Bonus points for diagonal lines
  - Power-ups (skip turn, peek at opponent)

- **Card variations**:
  - 3x3 grid (quick games)
  - 7x7 grid (long games)
  - Number ranges (1-50, 1-75)

**Implementation challenges**:
- Maintain backward compatibility
- Increased complexity
- Need consensus on rules in multiplayer

---

### Tournament Mode

**Status**: 💡 Idea

**Description**: Multi-round tournaments with brackets.

**Proposed features**:
- Multiple rounds
- Elimination or points-based
- Leaderboard tracking
- Persistent player profiles
- Spectator mode

**Implementation requirements**:
- Backend server for persistence
- Player authentication
- Match history
- Ranking system

**Use cases**:
- Competitive play
- Community events
- Prize pools

---

## 🎯 Mode Comparison

| Feature | Multiplayer | Single Player | Demo | Custom Rules | Tournament |
|---------|-------------|---------------|------|--------------|------------|
| **Status** | ✅ Live | 🔜 Planned | 🔜 Planned | 💡 Idea | 💡 Idea |
| **Players** | 2-5 | 1 | N/A | 2-5 | Many |
| **P2P Required** | Yes | No | No | Yes | Depends |
| **Backend Required** | No | No | No | No | Yes |
| **Win Condition** | 5 lines | 5 lines | 5 lines | Custom | Custom |
| **Difficulty** | Varies | Adjustable | N/A | Varies | Varies |

## 📝 Implementation Priority

### Phase 1: Current (✅ Complete)
- [x] Multiplayer mode
- [x] Turn-based gameplay
- [x] P2P networking
- [x] Basic game logic

### Phase 2: Near-term (🔜 Next)
1. **Single Player Mode**: Most requested, lowest complexity
2. **Demo Mode**: Great for onboarding and marketing

### Phase 3: Future (💡 Ideas)
3. **Custom Rules**: Adds variety, moderate complexity
4. **Tournament Mode**: Requires backend, highest complexity

## 🛠️ Technical Considerations

### Adding New Modes

To add a new game mode:

1. **Game logic** (`src/lib/game/`):
   - Keep pure functions mode-agnostic
   - Add mode-specific validation if needed
   - Use strategy pattern for different rule sets

2. **UI** (`src/components/`):
   - Mode selection screen
   - Mode-specific components
   - Shared components where possible

3. **State management** (`src/lib/stores/`):
   - Mode state in game store
   - Mode-specific derived state

4. **Testing**:
   - Unit tests for new rules
   - E2E tests for new flows

### Code Structure

```typescript
// src/lib/game/modes.ts
export type GameMode = 'multiplayer' | 'single-player' | 'demo';

export interface GameConfig {
  mode: GameMode;
  winCondition: WinCondition;
  cardSize: number;
  // ... other config
}

// Mode-specific logic
export function getWinConditionChecker(mode: GameMode) {
  switch (mode) {
    case 'multiplayer':
    case 'single-player':
      return checkFiveLines;
    case 'demo':
      return checkFiveLines; // Same for now
  }
}
```

## 🤝 Contributing

Interested in implementing a new game mode?

1. **Check existing issues**: See if it's already planned
2. **Open a discussion**: Discuss approach with maintainers
3. **Create a spec**: Document the mode thoroughly
4. **Submit a PR**: Implement with tests and docs

See [Contributing Guidelines](../development/contributing.md).

## 💬 Feedback

Have ideas for new game modes? We'd love to hear them!

- [Open a feature request](https://github.com/amitjoshi-ms/gametime-bingo/issues/new)
- [Start a discussion](https://github.com/amitjoshi-ms/gametime-bingo/discussions)

## 📚 Related Documentation

- [Gameplay Guide](../gameplay.md) - How to play multiplayer
- [Architecture Overview](../architecture.md) - System design
- [Game Logic API](../api/game-logic.md) - Core game functions

---

**Current Focus**: Multiplayer mode is our priority. Additional modes will be added based on community demand and development capacity.

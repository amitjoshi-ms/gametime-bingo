# How to Play Gametime Bingo

A comprehensive guide to playing Gametime Bingo, from creating games to winning strategies.

## 🎯 Game Overview

Gametime Bingo is a multiplayer turn-based BINGO game where players compete to complete 5 lines on their unique 5x5 cards. The first player to spell B-I-N-G-O (5 lines) wins!

### Key Concepts

- **5x5 Card**: Each player gets a unique card with numbers 1-25
- **Turn-based**: Players take turns calling numbers
- **Line Completion**: Complete horizontal, vertical, or diagonal lines
- **B-I-N-G-O Progress**: Each completed line advances your progress (B → I → N → G → O)
- **Win Condition**: First player to complete 5 lines wins

## 🚀 Getting Started

### Creating a Game

1. **Visit**: Go to [https://gametime-bingo.pages.dev](https://gametime-bingo.pages.dev)
2. **Click "Create Game"**: Start a new game session
3. **Enter Your Name**: Choose a display name (1-20 characters)
4. **Get Room Code**: A 6-character room code is generated (e.g., `ABC123`)
5. **Share**: Copy the URL or room code to invite friends

### Joining a Game

Two ways to join:

**Option 1: Direct Link**
- Click the shared URL from the host
- Enter your name
- Automatically join the game

**Option 2: Room Code**
1. Visit the home page
2. Click "Join Game"
3. Enter the 6-character room code
4. Enter your name
5. Click "Join"

## 🎮 Gameplay

### Game Lobby

Before the game starts, you're in the lobby:

- See all connected players (2-5 players supported)
- View your generated BINGO card
- Wait for the host to start the game
- Minimum 2 players required to start

**Host Actions**:
- Click "Start Game" when ready (requires 2+ players)
- New players cannot join once the game starts

### Playing Your Turn

When it's your turn:

1. **Number Pad Appears**: You'll see a grid of numbers 1-25
2. **Select a Number**: Click any number that hasn't been called yet
3. **Number is Called**: The selected number is announced to all players
4. **Auto-Marked**: The number is automatically marked on all cards that contain it
5. **Turn Advances**: The next player's turn begins

**Turn Indicators**:
- Green highlight = Your turn
- Player name shown = Other player's turn
- Called numbers appear in the history list

### Tracking Progress

**Your Card**:
- Unmarked cells: White background
- Marked cells: Highlighted (green/blue)
- Completed lines: Special highlight/indicator

**B-I-N-G-O Progress**:
- Displayed as letters: B-I-N-G-O
- Each completed line lights up the next letter
- Need all 5 letters to win

**Called Numbers**:
- Shown in chronological order
- Recently called numbers highlighted
- Shows who called each number

### Winning the Game

**Win Condition**:
- Complete 5 unique lines (any combination of horizontal, vertical, diagonal)
- Each completed line counts as one letter in B-I-N-G-O

**Valid Lines**:
- 5 horizontal rows
- 5 vertical columns
- 2 diagonals (top-left to bottom-right, top-right to bottom-left)
- Total: 12 possible lines per card

**When You Win**:
1. Your 5th line completes
2. Confetti/celebration animation appears
3. All players see "Winner: [Your Name]"
4. Game ends for everyone
5. Option to play again

**Tie Breaker**:
- If two players complete their 5th line on the same turn
- Winner is determined by join order (first to join wins)

## 🎯 Strategies & Tips

### Early Game
- **Spread Your Calls**: Call numbers that don't overlap with your existing marked cells
- **Target Multiple Lines**: Look for numbers that contribute to multiple potential lines
- **Track Opponents**: Watch the called numbers to estimate other players' progress

### Mid Game
- **Focus on Close Lines**: Prioritize completing lines that need only 1-2 more numbers
- **Block Opponents**: If you know a player is close to a line, avoid calling their numbers
- **Diagonal Awareness**: Don't forget about diagonal lines - they're easy to miss!

### Late Game
- **Calculate Odds**: Know how many uncalled numbers remain
- **Strategic Calling**: Call numbers that complete your lines while blocking others
- **Multiple Paths**: Always work toward multiple lines simultaneously

### Pro Tips
- **Remember Called Numbers**: Don't call the same number twice
- **Quick Math**: Count your completed lines frequently
- **Card Familiarity**: Memorize your card layout for faster recognition
- **Turn Speed**: Call numbers quickly - faster turns can create psychological pressure

## 🔄 Game Flow

```
Home → Create/Join → Lobby → Playing → Game Over → Play Again
```

**Detailed Flow**:

1. **Home Screen**
   - Create game (becomes host)
   - Join game (enter room code)

2. **Lobby** (waiting room)
   - Players join
   - Host starts game when 2+ players present
   - View your card

3. **Playing** (active game)
   - Turn-based number calling
   - Real-time card marking
   - Progress tracking
   - Line completion detection

4. **Game Over** (winner declared)
   - Winner announcement
   - Final standings
   - Option to play again

## 👥 Multiplayer Features

### Player Count
- **Minimum**: 2 players
- **Maximum**: 5 players
- **Recommended**: 3-4 players for best experience

### Connection Status

**Connected** (green dot):
- Player is online and active
- Can take their turn normally

**Reconnecting** (yellow dot):
- Player temporarily lost connection
- Game waits up to 30 seconds for reconnection

**Disconnected** (red dot):
- Player left or connection lost
- Turn is automatically skipped
- Player can rejoin with same room code

### Host Migration

If the host disconnects:
- A new host is automatically selected
- Game continues normally
- New host sees host controls (if in lobby)

### Leaving a Game

**Intentional Leave**:
- Click "Leave Game" button
- Your turn is skipped going forward
- Other players continue

**Accidental Disconnect**:
- Automatically marked as "reconnecting"
- 30-second window to rejoin
- Rejoin with the same room code/URL

## 📱 Interface Guide

### Main Components

**BINGO Card**:
- 5x5 grid of numbers
- Click numbers to see details (not to mark - marking is automatic)
- Lines highlighted when completed

**Number Pad** (your turn only):
- Grid of 1-25
- Grayed out: Already called
- Clickable: Available to call

**Called Numbers**:
- Scrollable list
- Most recent at top
- Shows who called each number

**Player List**:
- All connected players
- Connection status indicators
- Current turn highlight

**Progress Tracker**:
- Your B-I-N-G-O letters
- Completed lines count
- Visual progress bar

## ❓ Frequently Asked Questions

**Q: Can I mark numbers manually?**
A: No, numbers are automatically marked when called. This ensures fairness and sync across all players.

**Q: Can I see other players' cards?**
A: No, cards are private. You can only see your own card and the list of called numbers.

**Q: What if I call a wrong number?**
A: You can't undo a call. Choose carefully! Numbers are validated before being called.

**Q: Can players join mid-game?**
A: No, new players can only join in the lobby before the game starts.

**Q: What happens if everyone disconnects?**
A: The game session ends. Players must create a new game.

**Q: Do I need to sign up?**
A: No! Just enter your name and play. No accounts or logins required.

**Q: Is my data saved?**
A: Your player name and current game state are saved in your browser (localStorage) for reconnection purposes.

**Q: Can I play solo?**
A: Currently, the game requires 2+ players. Single-player mode is not yet implemented.

## 🐛 Troubleshooting

### Can't Connect to Game
- Verify room code is correct (6 characters)
- Check your internet connection
- Try refreshing the page
- Use Chrome or Edge browser

### Numbers Not Marking
- Ensure you have a stable connection (check connection indicator)
- Try refreshing the page
- Check browser console for errors

### Game Frozen/Stuck
- Refresh the page (you'll rejoin automatically if saved)
- Check if it's another player's turn
- Verify connection status

### Can't Start Game
- Ensure 2+ players in lobby
- Verify you are the host (host indicator shown)
- Check that game hasn't already started

## 🎉 Enjoy the Game!

Now you're ready to play Gametime Bingo! Create a game, invite friends, and may the best BINGO player win!

**Have feedback?** [Open an issue](https://github.com/amitjoshi-ms/gametime-bingo/issues) on GitHub.

<script lang="ts">
  /**
   * Main App component - handles routing between screens
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Home from './components/Home.svelte';
  import Lobby from './components/Lobby.svelte';
  import Game from './components/Game.svelte';
  import GameOver from './components/GameOver.svelte';
  
  import { createRoom, joinRoom, leaveRoom, getActions, onPeerJoin, getConnectedPeers, stopPeerDiscovery } from '$lib/network/room';
  import { setHostSession, registerHostHandlers, broadcastSyncState, getHostSession } from '$lib/network/host';
  import { registerSyncHandlers, sendPlayerJoin, sendCallNumber, clearCallbacks } from '$lib/network/sync';
  import { createSession, addPlayer, startGame as startGameSession, callNumber as callSessionNumber, advanceTurn as advanceSessionTurn } from '$lib/game/session';
  import * as gameStore from '$lib/stores/game.svelte';
  import * as playerStore from '$lib/stores/player.svelte';
  import { saveState, loadState, clearState, type PersistedState } from '$lib/utils/storage';
  import { generatePlayerId } from '$lib/utils/random';

  // ============================================================================
  // App State
  // ============================================================================

  type Screen = 'home' | 'lobby' | 'game';

  let currentScreen = $state<Screen>('home');
  let roomCode = $state<string>('');
  let isHost = $state(false);
  let loading = $state(false);
  let error = $state('');

  // Get room code from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const urlRoomCode = urlParams.get('room')?.toUpperCase() || '';

  // ============================================================================
  // Lifecycle
  // ============================================================================

  $effect(() => {
    // Check for saved session on mount
    const savedState = loadState();
    if (savedState && savedState.roomCode) {
      // Restore player identity
      playerStore.setPlayerId(savedState.playerId);
      playerStore.setPlayerName(savedState.playerName);
      
      // Attempt to rejoin the session
      attemptSessionRecovery(savedState);
    }
    
    return () => {
      // Cleanup on unmount
      clearCallbacks();
    };
  });

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Sends player-join message once a peer connection is established.
   * WebRTC connections are asynchronous, so we register a callback for when
   * a peer joins and also check if already connected.
   */
  function sendPlayerJoinWhenConnected(playerId: string, playerName: string): void {
    // Register callback to send player-join when peer connection is established
    onPeerJoin((_peerId) => {
      sendPlayerJoin(playerId, playerName);
    });
    
    // Check if already connected (unlikely but possible if connection was fast)
    const connectedPeers = getConnectedPeers();
    if (connectedPeers.length > 0) {
      sendPlayerJoin(playerId, playerName);
    }
  }

  /**
   * Attempts to rejoin a previous session.
   */
  async function attemptSessionRecovery(savedState: PersistedState) {
    if (!savedState.roomCode) return;
    
    loading = true;
    error = '';
    
    try {
      // Join the room
      joinRoom(savedState.roomCode);
      roomCode = savedState.roomCode;
      
      // Register sync handlers
      registerSyncHandlers();
      
      // Set local player ID
      gameStore.setLocalPlayerId(savedState.playerId);
      
      // Send player-join when connected to host
      sendPlayerJoinWhenConnected(savedState.playerId, savedState.playerName);
      
      // Recover card if we have the seed
      if (savedState.cardSeed) {
        playerStore.generateNewCard(savedState.cardSeed);
      }
      
      // Determine if we should be host (we'll know after sync-state arrives)
      isHost = savedState.wasHost;
      currentScreen = 'lobby';
    } catch (err) {
      console.warn('Session recovery failed, starting fresh:', err);
      // Clear the stale state
      clearState();
      // Don't show error - just start fresh
    } finally {
      loading = false;
    }
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  function handleCreateGame() {
    loading = true;
    error = '';

    try {
      // Generate player ID if needed
      const playerId = playerStore.getPlayerId() || generatePlayerId();
      const playerName = playerStore.getPlayerName() || 'Player 1';
      
      // Set local player info
      playerStore.setPlayerId(playerId);
      playerStore.setPlayerName(playerName);
      
      // Create the P2P room
      const { roomCode: newRoomCode } = createRoom();
      roomCode = newRoomCode;
      
      // Create game session (createSession adds host as first player)
      const session = createSession(newRoomCode, playerId, playerName);
      
      // Set host session and register handlers
      setHostSession(session);
      gameStore.setSession(session);
      gameStore.setLocalPlayerId(playerId);
      
      registerHostHandlers();
      registerSyncHandlers();
      
      // Update URL without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', newRoomCode);
      window.history.pushState({}, '', newUrl.toString());
      
      // Save state
      saveState({
        playerId,
        playerName,
        roomCode: newRoomCode,
        wasHost: true,
        savedAt: Date.now(),
      });
      
      isHost = true;
      currentScreen = 'lobby';
    } catch (err) {
      console.error('Failed to create game:', err);
      error = 'Failed to create game. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleJoinGame(code: string, name: string) {
    loading = true;
    error = '';

    try {
      // Generate player ID if needed
      const playerId = playerStore.getPlayerId() || generatePlayerId();
      
      // Set local player info
      playerStore.setPlayerId(playerId);
      playerStore.setPlayerName(name);
      
      // Join the P2P room
      joinRoom(code);
      roomCode = code;
      
      // Register sync handlers (to receive state from host)
      registerSyncHandlers();
      
      // Set local player ID for store
      gameStore.setLocalPlayerId(playerId);
      
      // Send player-join when connected to host
      sendPlayerJoinWhenConnected(playerId, name);
      
      // Update URL without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', code);
      window.history.pushState({}, '', newUrl.toString());
      
      // Save state
      saveState({
        playerId,
        playerName: name,
        roomCode: code,
        wasHost: false,
        savedAt: Date.now(),
      });
      
      isHost = false;
      currentScreen = 'lobby';
    } catch (err) {
      console.error('Failed to join game:', err);
      error = 'Failed to join game. Please check the room code and try again.';
    } finally {
      loading = false;
    }
  }

  function handleStartGame() {
    const session = getHostSession();
    if (!session || !isHost) return;
    
    try {
      // Stop looking for new peers once game starts
      stopPeerDiscovery();
      
      // Start the game
      const startedSession = startGameSession(session);
      setHostSession(startedSession);
      gameStore.setSession(startedSession);
      
      // Generate local card
      playerStore.generateNewCard();
      
      // Broadcast start-game to all players
      const actions = getActions();
      if (actions) {
        actions.sendStartGame({
          type: 'start-game',
          firstPlayerIndex: startedSession.currentTurnIndex,
          timestamp: Date.now(),
        });
      }
      
      // Broadcast updated state
      broadcastSyncState(startedSession);
      
      currentScreen = 'game';
    } catch (err) {
      console.error('Failed to start game:', err);
      error = 'Failed to start game. Please try again.';
    }
  }

  function handleLeave() {
    try {
      leaveRoom();
      clearCallbacks();
      clearState();
      gameStore.reset();
      playerStore.reset();
      
      // Clear URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('room');
      window.history.pushState({}, '', newUrl.toString());
      
      roomCode = '';
      isHost = false;
      currentScreen = 'home';
    } catch (err) {
      console.error('Failed to leave game:', err);
    }
  }

  function handleCallNumber(number: number) {
    if (!isHost) {
      // Send to host for validation
      sendCallNumber(playerStore.getPlayerId(), number);
    } else {
      // Host processes directly
      let session = getHostSession();
      if (session) {
        // Add the called number
        session = callSessionNumber(session, number);
        
        // Advance turn using the helper function
        session = advanceSessionTurn(session);
        const nextTurnIndex = session.currentTurnIndex;
        
        // Update host session state
        setHostSession(session);
        gameStore.setSession(session);
        
        // Mark on local card
        playerStore.markNumber(number);
        
        // Broadcast to others
        const actions = getActions();
        if (actions) {
          actions.sendNumberCalled({
            type: 'num-called',
            number,
            calledBy: playerStore.getPlayerId(),
            nextTurnIndex,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  function handlePlayAgain() {
    // Reset for new game but stay in lobby
    playerStore.resetForNewGame();
    
    if (isHost) {
      const session = getHostSession();
      if (session) {
        // Create new session with host as first player
        const playerId = playerStore.getPlayerId();
        const playerName = playerStore.getPlayerName();
        const newSession = createSession(roomCode, playerId, playerName);
        // Re-add other players (skip host who is already in newSession)
        let updatedSession = newSession;
        for (const player of session.players) {
          if (player.id !== playerId) {
            updatedSession = addPlayer(updatedSession, player.id, player.name);
          }
        }
        setHostSession(updatedSession);
        gameStore.setSession(updatedSession);
        broadcastSyncState(updatedSession);
      }
    }
    
    currentScreen = 'lobby';
  }

  // Watch for game status changes to show game over
  const gameStatus = $derived(gameStore.getGameStatus());
  const winnerId = $derived(gameStore.getWinnerId());

  $effect(() => {
    if (gameStatus === 'playing' && currentScreen === 'lobby') {
      currentScreen = 'game';
    }
  });
</script>

<main class="app">
  {#if currentScreen === 'home'}
    <Home
      onCreateGame={handleCreateGame}
      onJoinGame={handleJoinGame}
      prefillRoomCode={urlRoomCode}
      {loading}
      {error}
    />
  {:else if currentScreen === 'lobby'}
    <Lobby
      {roomCode}
      {isHost}
      onStartGame={handleStartGame}
      onLeave={handleLeave}
    />
  {:else if currentScreen === 'game'}
    <Game
      onCallNumber={handleCallNumber}
      onLeave={handleLeave}
    />
    
    {#if gameStatus === 'completed'}
      {@const winner = gameStore.getPlayers().find(p => p.id === winnerId) ?? null}
      {@const isWinner = winnerId === playerStore.getPlayerId()}
      <GameOver
        {winner}
        {isWinner}
        localProgress={playerStore.getProgress()}
        onPlayAgain={handlePlayAgain}
        onLeave={handleLeave}
      />
    {/if}
  {/if}
</main>

<style>
  .app {
    min-height: 100vh;
    background-color: var(--color-background, #ffffff);
  }
</style>

<script lang="ts">
  /**
   * Lobby component - displays room code, player list, and Start Game button
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Button from './ui/Button.svelte';
  import PlayerList from './PlayerList.svelte';
  import ConnectionStatus from './ConnectionStatus.svelte';
  import * as gameStore from '$lib/stores/game.svelte';
  import { MIN_PLAYERS, MAX_PLAYERS } from '$lib/game/types';

  interface Props {
    /** Room code to display */
    roomCode: string;
    /** Whether the current player is the host */
    isHost?: boolean;
    /** Handler for starting the game */
    onStartGame?: () => void;
    /** Handler for leaving the lobby */
    onLeave?: () => void;
  }

  let { roomCode, isHost = false, onStartGame, onLeave }: Props = $props();

  // Get players from game store
  const players = $derived(gameStore.getPlayers());
  const canStart = $derived(gameStore.getCanStart());

  // Copy room code to clipboard
  let copied = $state(false);

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      // Fallback for browsers without clipboard API
      console.error('Failed to copy room code');
    }
  }

  // Generate shareable URL
  const shareUrl = $derived(
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      : ''
  );

  async function shareGame() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my BINGO game!',
          text: `Join my BINGO game with code: ${roomCode}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        await copyRoomCode();
      }
    } else {
      await copyRoomCode();
    }
  }
</script>

<div class="lobby">
  <header class="lobby__header">
    <ConnectionStatus />
    <h1 class="lobby__title">Game Lobby</h1>
  </header>

  <section class="lobby__room-code" aria-labelledby="room-code-label">
    <p id="room-code-label" class="lobby__label">Room Code</p>
    <div class="lobby__code-display">
      <span class="lobby__code" aria-label="Room code: {roomCode}">{roomCode}</span>
      <button
        type="button"
        class="lobby__copy-btn"
        onclick={copyRoomCode}
        aria-label={copied ? 'Copied!' : 'Copy room code'}
      >
        {#if copied}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        {:else}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        {/if}
      </button>
    </div>
    <Button variant="secondary" size="sm" onclick={shareGame}>
      {#snippet children()}
        Share Invite Link
      {/snippet}
    </Button>
  </section>

  <section class="lobby__players" aria-labelledby="players-label">
    <h2 id="players-label" class="lobby__label">
      Players ({players.length}/{MAX_PLAYERS})
    </h2>
    <PlayerList {players} />
    <p class="lobby__player-hint">
      {#if players.length < MIN_PLAYERS}
        Need at least {MIN_PLAYERS} players to start
      {:else if players.length >= MAX_PLAYERS}
        Maximum players reached
      {:else}
        Waiting for more players...
      {/if}
    </p>
  </section>

  <footer class="lobby__actions">
    {#if isHost}
      <Button
        variant="primary"
        fullWidth
        disabled={!canStart}
        onclick={onStartGame}
      >
        {#snippet children()}
          Start Game
        {/snippet}
      </Button>
    {:else}
      <p class="lobby__wait-message">Waiting for host to start the game...</p>
    {/if}
    <Button variant="ghost" fullWidth onclick={onLeave}>
      {#snippet children()}
        Leave Lobby
      {/snippet}
    </Button>
  </footer>
</div>

<style>
  .lobby {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 28rem;
    margin: 0 auto;
    min-height: 100vh;
  }

  .lobby__header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }

  .lobby__title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text, #1f2937);
    margin: 0;
    text-align: center;
  }

  .lobby__room-code {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background-color: var(--color-gray-50, #f9fafb);
    border-radius: 0.75rem;
    border: 2px dashed var(--color-border, #d1d5db);
  }

  .lobby__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .lobby__code-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .lobby__code {
    font-size: 2.5rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: var(--color-primary, #2563eb);
    letter-spacing: 0.15em;
  }

  .lobby__copy-btn {
    /* 48px touch target */
    min-width: 48px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: var(--color-text-muted, #6b7280);
    cursor: pointer;
    transition: all 150ms ease-in-out;
  }

  .lobby__copy-btn:hover {
    background-color: var(--color-gray-200, #e5e7eb);
    color: var(--color-text, #1f2937);
  }

  .lobby__copy-btn:focus-visible {
    outline: 3px solid var(--color-primary-light, #60a5fa);
    outline-offset: 2px;
  }

  .lobby__players {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
  }

  .lobby__player-hint {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    text-align: center;
    margin: 0;
  }

  .lobby__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .lobby__wait-message {
    font-size: 1rem;
    color: var(--color-text-muted, #6b7280);
    text-align: center;
    margin: 0;
    padding: 1rem;
    background-color: var(--color-gray-50, #f9fafb);
    border-radius: 0.5rem;
  }
</style>

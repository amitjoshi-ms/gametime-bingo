<script lang="ts">
  /**
   * Game component - main game screen layout
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Card from './Card.svelte';
  import NumberPad from './NumberPad.svelte';
  import CalledNumbers from './CalledNumbers.svelte';
  import Progress from './Progress.svelte';
  import PlayerList from './PlayerList.svelte';
  import ConnectionStatus from './ConnectionStatus.svelte';
  import Button from './ui/Button.svelte';
  import * as gameStore from '$lib/stores/game.svelte';
  import * as playerStore from '$lib/stores/player.svelte';

  interface Props {
    /** Handler for calling a number */
    onCallNumber?: (number: number) => void;
    /** Handler for leaving the game */
    onLeave?: () => void;
  }

  let { onCallNumber, onLeave }: Props = $props();

  // Get game state from store (using getter functions)
  const isPlaying = $derived(gameStore.getGameStatus() === 'playing');
  const isMyTurn = $derived(gameStore.getIsMyTurn());
  const calledNumbers = $derived(gameStore.getCalledNumbers());
  const currentTurnPlayer = $derived(gameStore.getCurrentTurnPlayer());
  const players = $derived(gameStore.getPlayers());
  const localPlayerId = $derived(gameStore.getLocalPlayerId());

  // Get player state from store (using getter functions)
  const cardGrid = $derived(playerStore.getCardGrid());
  const markedCells = $derived(playerStore.getMarkedCells());
  const completedLines = $derived(playerStore.getCompletedLines());
  const recentlyCompletedLines = $derived(playerStore.getRecentlyCompletedLines());
  const progress = $derived(playerStore.getProgress());

  // Last called number for highlighting
  const lastCalledNumber = $derived(
    calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null
  );

  function handleCallNumber(number: number) {
    onCallNumber?.(number);
  }
</script>

<div class="game">
  <header class="game__header">
    <div class="game__header-left">
      <ConnectionStatus showLabel={false} />
    </div>
    <div class="game__header-center">
      <Progress completedLines={progress} />
    </div>
    <div class="game__header-right">
      <Button variant="ghost" size="sm" onclick={onLeave}>
        {#snippet children()}Leave{/snippet}
      </Button>
    </div>
  </header>

  <main class="game__main">
    <section class="game__card-section">
      <Card
        grid={cardGrid}
        marked={markedCells}
        {completedLines}
        {recentlyCompletedLines}
        {lastCalledNumber}
      />
    </section>

    <section class="game__turn-indicator" aria-live="polite">
      {#if isMyTurn}
        <span class="game__turn game__turn--yours">Your Turn!</span>
      {:else if currentTurnPlayer}
        <span class="game__turn">{currentTurnPlayer.name}'s Turn</span>
      {:else}
        <span class="game__turn">Waiting...</span>
      {/if}
    </section>

    <section class="game__controls">
      <NumberPad
        {calledNumbers}
        {isMyTurn}
        {isPlaying}
        onCallNumber={handleCallNumber}
      />
    </section>
  </main>

  <aside class="game__sidebar">
    <CalledNumbers numbers={calledNumbers} maxDisplay={10} />
    <div class="game__players">
      <h3 class="game__players-title">Players</h3>
      <PlayerList {players} currentPlayerId={localPlayerId ?? undefined} />
    </div>
  </aside>
</div>

<style>
  .game {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1rem;
    gap: 1rem;
  }

  .game__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background-color: var(--color-gray-50, #f9fafb);
    border-radius: 0.75rem;
  }

  .game__header-left,
  .game__header-right {
    flex: 1;
    display: flex;
  }

  .game__header-left {
    justify-content: flex-start;
  }

  .game__header-right {
    justify-content: flex-end;
  }

  .game__header-center {
    display: flex;
    justify-content: center;
  }

  .game__main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    flex: 1;
  }

  .game__card-section {
    display: flex;
    justify-content: center;
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
  }

  .game__turn-indicator {
    text-align: center;
  }

  .game__turn {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-muted, #6b7280);
  }

  .game__turn--yours {
    color: var(--color-primary, #2563eb);
    animation: pulse 1s ease-in-out infinite;
  }

  .game__controls {
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
  }

  .game__sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .game__players {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .game__players-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text, #1f2937);
    margin: 0;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Responsive: Desktop layout */
  @media (min-width: 768px) {
    .game {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .game__header {
      width: 100%;
      flex: none;
    }

    .game__main {
      flex: 2;
      min-width: 300px;
    }

    .game__sidebar {
      flex: 1;
      min-width: 250px;
      max-width: 320px;
    }
  }
</style>

<script lang="ts">
  /**
   * GameOver component - winner announcement and final progress
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Button from './ui/Button.svelte';
  import Progress from './Progress.svelte';
  import type { Player } from '$lib/game/types';

  interface Props {
    /** Winner of the game */
    winner: Player | null;
    /** Whether the local player won */
    isWinner?: boolean;
    /** Local player's final progress */
    localProgress?: number;
    /** Handler for playing again */
    onPlayAgain?: () => void;
    /** Handler for leaving */
    onLeave?: () => void;
  }

  let {
    winner,
    isWinner = false,
    localProgress = 0,
    onPlayAgain,
    onLeave,
  }: Props = $props();
</script>

<div class="game-over" role="alertdialog" aria-labelledby="game-over-title">
  <div class="game-over__content">
    {#if isWinner}
      <div class="game-over__celebration" aria-hidden="true">
        🎉🏆🎉
      </div>
      <h1 id="game-over-title" class="game-over__title game-over__title--winner">
        You Won!
      </h1>
      <p class="game-over__subtitle">Congratulations!</p>
    {:else if winner}
      <h1 id="game-over-title" class="game-over__title">
        Game Over
      </h1>
      <p class="game-over__winner-name">
        {winner.name} wins! 🏆
      </p>
    {:else}
      <h1 id="game-over-title" class="game-over__title">
        Game Over
      </h1>
      <p class="game-over__subtitle">No winner</p>
    {/if}

    <div class="game-over__progress">
      <p class="game-over__progress-label">Your Final Progress</p>
      <Progress completedLines={localProgress} animate={false} />
    </div>

    <div class="game-over__actions">
      <Button variant="primary" size="lg" fullWidth onclick={onPlayAgain}>
        {#snippet children()}
          Play Again
        {/snippet}
      </Button>
      <Button variant="ghost" fullWidth onclick={onLeave}>
        {#snippet children()}
          Leave Game
        {/snippet}
      </Button>
    </div>
  </div>
</div>

<style>
  .game-over {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    padding: 1.5rem;
    z-index: 100;
    animation: fadeIn 300ms ease-out;
  }

  .game-over__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    background-color: var(--color-background, #ffffff);
    border-radius: 1rem;
    max-width: 24rem;
    width: 100%;
    text-align: center;
    animation: slideUp 400ms ease-out;
  }

  .game-over__celebration {
    font-size: 3rem;
    animation: bounce 600ms ease-out;
  }

  .game-over__title {
    font-size: 2rem;
    font-weight: 900;
    color: var(--color-text, #1f2937);
    margin: 0;
  }

  .game-over__title--winner {
    color: var(--color-success, #22c55e);
    animation: celebrate 600ms ease-out;
  }

  .game-over__subtitle {
    font-size: 1.125rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .game-over__winner-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary, #2563eb);
    margin: 0;
  }

  .game-over__progress {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }

  .game-over__progress-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .game-over__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(2rem);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1rem);
    }
  }

  @keyframes celebrate {
    0% {
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
</style>

<script lang="ts">
  /**
   * PlayerList component - shows player names and connection status
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import type { Player } from '$lib/game/types';

  interface Props {
    /** List of players in the session */
    players: Player[];
    /** Optional: ID of the current player (to highlight "You") */
    currentPlayerId?: string;
  }

  let { players, currentPlayerId }: Props = $props();

  function getStatusIcon(status: Player['connectionStatus']): string {
    switch (status) {
      case 'connected':
        return '🟢';
      case 'reconnecting':
        return '🟡';
      case 'disconnected':
        return '🔴';
      default:
        return '⚪';
    }
  }

  function getStatusLabel(status: Player['connectionStatus']): string {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }
</script>

<ul class="player-list" role="list" aria-label="Players in lobby">
  {#each players as player (player.id)}
    <li class="player-list__item">
      <span
        class="player-list__status"
        aria-label={getStatusLabel(player.connectionStatus)}
        title={getStatusLabel(player.connectionStatus)}
      >
        {getStatusIcon(player.connectionStatus)}
      </span>
      <span class="player-list__name">
        {player.name}
        {#if player.id === currentPlayerId}
          <span class="player-list__you">(You)</span>
        {/if}
        {#if player.isHost}
          <span class="player-list__host">Host</span>
        {/if}
      </span>
    </li>
  {/each}
</ul>

{#if players.length === 0}
  <p class="player-list__empty">No players have joined yet</p>
{/if}

<style>
  .player-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-list__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-background, #ffffff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    /* Minimum touch target height */
    min-height: 48px;
  }

  .player-list__status {
    font-size: 0.75rem;
    line-height: 1;
  }

  .player-list__name {
    flex: 1;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text, #1f2937);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .player-list__you {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-text-muted, #6b7280);
  }

  .player-list__host {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-primary, #2563eb);
    background-color: var(--color-primary-light, #dbeafe);
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .player-list__empty {
    text-align: center;
    color: var(--color-text-muted, #6b7280);
    font-size: 0.875rem;
    padding: 2rem;
    margin: 0;
  }
</style>

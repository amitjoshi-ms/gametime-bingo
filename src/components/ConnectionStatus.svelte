<script lang="ts">
  /**
   * ConnectionStatus component - network status indicator
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import type { ConnectionStatus as ConnectionStatusType } from '$lib/game/types';

  interface Props {
    /** Connection status */
    status?: ConnectionStatusType;
    /** Show text label */
    showLabel?: boolean;
  }

  let { status = 'connected', showLabel = true }: Props = $props();

  const statusConfig = $derived(
    (() => {
      switch (status) {
        case 'connected':
          return {
            color: 'var(--color-success, #22c55e)',
            label: 'Connected',
            pulse: false,
          };
        case 'reconnecting':
          return {
            color: 'var(--color-warning, #f59e0b)',
            label: 'Reconnecting...',
            pulse: true,
          };
        case 'disconnected':
          return {
            color: 'var(--color-danger, #dc2626)',
            label: 'Disconnected',
            pulse: false,
          };
        default:
          return {
            color: 'var(--color-gray-400, #9ca3af)',
            label: 'Unknown',
            pulse: false,
          };
      }
    })()
  );
</script>

<div
  class="connection-status"
  role="status"
  aria-live="polite"
  aria-label="Connection status: {statusConfig.label}"
>
  <span
    class="connection-status__indicator"
    class:connection-status__indicator--pulse={statusConfig.pulse}
    style="background-color: {statusConfig.color}"
    aria-hidden="true"
  ></span>
  {#if showLabel}
    <span class="connection-status__label">{statusConfig.label}</span>
  {/if}
</div>

<style>
  .connection-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .connection-status__indicator {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .connection-status__indicator--pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  .connection-status__label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-muted, #6b7280);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }
</style>

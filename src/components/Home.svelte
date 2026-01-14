<script lang="ts">
  /**
   * Home screen component - Create Game and Join Game buttons
   * Based on: specs/001-bingo-game/ux-spec.md
   */

  import Button from './ui/Button.svelte';
  import Input from './ui/Input.svelte';
  import Modal from './ui/Modal.svelte';

  interface Props {
    /** Handler for creating a game */
    onCreateGame?: () => void;
    /** Handler for joining a game */
    onJoinGame?: (roomCode: string, playerName: string) => void;
    /** Pre-filled room code (from URL) */
    prefillRoomCode?: string;
    /** Loading state */
    loading?: boolean;
    /** Error message */
    error?: string;
  }

  let {
    onCreateGame,
    onJoinGame,
    prefillRoomCode = '',
    loading = false,
    error = '',
  }: Props = $props();

  // Modal states
  let showCreateModal = $state(false);
  let showJoinModal = $state(!!prefillRoomCode);

  // Form inputs
  let playerName = $state('');
  let roomCode = $state(prefillRoomCode);

  // Validation errors
  let nameError = $state('');
  let codeError = $state('');

  function validateName(): boolean {
    if (!playerName.trim()) {
      nameError = 'Please enter your name';
      return false;
    }
    if (playerName.trim().length > 20) {
      nameError = 'Name must be 20 characters or less';
      return false;
    }
    nameError = '';
    return true;
  }

  function validateCode(): boolean {
    if (!roomCode.trim()) {
      codeError = 'Please enter a room code';
      return false;
    }
    if (!/^[A-Z0-9]{6}$/i.test(roomCode.trim())) {
      codeError = 'Room code must be 6 characters';
      return false;
    }
    codeError = '';
    return true;
  }

  function handleCreate() {
    if (!validateName()) return;
    showCreateModal = false;
    onCreateGame?.();
  }

  function handleJoin() {
    const nameValid = validateName();
    const codeValid = validateCode();
    if (!nameValid || !codeValid) return;
    showJoinModal = false;
    onJoinGame?.(roomCode.toUpperCase().trim(), playerName.trim());
  }

  function openCreateModal() {
    nameError = '';
    showCreateModal = true;
  }

  function openJoinModal() {
    nameError = '';
    codeError = '';
    showJoinModal = true;
  }

  // Format room code input (uppercase, alphanumeric only)
  function handleCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    roomCode = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    codeError = '';
  }
</script>

<div class="home">
  <header class="home__header">
    <h1 class="home__title">
      <span class="home__title-bingo">BINGO</span>
    </h1>
    <p class="home__subtitle">Multiplayer Party Game</p>
  </header>

  <main class="home__actions">
    <Button variant="primary" size="lg" fullWidth onclick={openCreateModal}>
      {#snippet children()}
        Create Game
      {/snippet}
    </Button>

    <Button variant="secondary" size="lg" fullWidth onclick={openJoinModal}>
      {#snippet children()}
        Join Game
      {/snippet}
    </Button>
  </main>

  {#if error}
    <div class="home__error" role="alert">
      {error}
    </div>
  {/if}

  <footer class="home__footer">
    <p>2-5 players • Numbers 1-25 • First to 5 lines wins!</p>
  </footer>
</div>

<!-- Create Game Modal -->
<Modal bind:open={showCreateModal} title="Create Game">
  {#snippet children()}
    <div class="modal-form">
      <Input
        label="Your Name"
        placeholder="Enter your name"
        bind:value={playerName}
        error={nameError}
        maxlength={20}
        required
        fullWidth
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
    </div>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={() => (showCreateModal = false)}>
      {#snippet children()}Cancel{/snippet}
    </Button>
    <Button variant="primary" onclick={handleCreate} {loading}>
      {#snippet children()}Create{/snippet}
    </Button>
  {/snippet}
</Modal>

<!-- Join Game Modal -->
<Modal bind:open={showJoinModal} title="Join Game">
  {#snippet children()}
    <div class="modal-form">
      <Input
        label="Room Code"
        placeholder="ABC123"
        value={roomCode}
        error={codeError}
        maxlength={6}
        required
        fullWidth
        autocapitalize="characters"
        oninput={handleCodeInput}
      />
      <Input
        label="Your Name"
        placeholder="Enter your name"
        bind:value={playerName}
        error={nameError}
        maxlength={20}
        required
        fullWidth
        onkeydown={(e) => e.key === 'Enter' && handleJoin()}
      />
    </div>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={() => (showJoinModal = false)}>
      {#snippet children()}Cancel{/snippet}
    </Button>
    <Button variant="primary" onclick={handleJoin} {loading}>
      {#snippet children()}Join{/snippet}
    </Button>
  {/snippet}
</Modal>

<style>
  .home {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 2rem 1.5rem;
    max-width: 28rem;
    margin: 0 auto;
  }

  .home__header {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .home__title {
    font-size: 4rem;
    font-weight: 900;
    margin: 0;
    line-height: 1;
  }

  .home__title-bingo {
    background: linear-gradient(
      135deg,
      var(--color-primary, #2563eb) 0%,
      var(--color-secondary, #7c3aed) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.1em;
  }

  .home__subtitle {
    font-size: 1.125rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0.5rem 0 0;
  }

  .home__actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem 0;
  }

  .home__error {
    background-color: var(--color-danger-light, #fee2e2);
    color: var(--color-danger, #dc2626);
    padding: 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .home__footer {
    text-align: center;
    padding: 1rem 0;
  }

  .home__footer p {
    font-size: 0.875rem;
    color: var(--color-text-muted, #6b7280);
    margin: 0;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>

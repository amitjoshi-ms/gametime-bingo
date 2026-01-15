/**
 * Trystero room management
 * Based on: specs/001-bingo-game/contracts/p2p-protocol.md
 */

import { joinRoom as trysteroJoinRoom, pauseRelayReconnection, resumeRelayReconnection } from 'trystero/torrent';
import type { Room } from 'trystero';
import { generateRoomCode } from '../utils/random';
import type {
  SyncStatePayload,
  PlayerJoinPayload,
  PlayerLeavePayload,
  StartGamePayload,
  CallNumberPayload,
  NumberCalledPayload,
  DeclareWinnerPayload,
  GameOverPayload,
  PingPayload,
  PongPayload,
  HostTransferPayload,
  ErrorPayload,
} from './messages';

// ============================================================================
// Constants
// ============================================================================

/** App ID for Trystero room isolation */
const APP_ID = 'gametime-bingo-v1';

/** 
 * BitTorrent WebTorrent trackers for WebRTC signaling
 * These are reliable public trackers designed for high traffic
 */
const TRACKER_URLS = [
  'wss://tracker.webtorrent.dev',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
];

/** Ping interval in milliseconds */
const PING_INTERVAL_MS = 5000;

/** Time to mark as reconnecting after missed pings */
const RECONNECTING_THRESHOLD_MS = 10000;

/** Time to mark as disconnected after missed pings */
const DISCONNECT_THRESHOLD_MS = 30000;

// ============================================================================
// Room State
// ============================================================================

let currentRoom: Room | null = null;
let currentRoomCode: string | null = null;
let pingIntervalId: ReturnType<typeof setInterval> | null = null;

// Peer tracking for connection status
const peerLastSeen = new Map<string, number>();

// ============================================================================
// Action Senders & Handlers (created when room joins)
// ============================================================================

type ActionSender<T> = (data: T, peerId?: string) => void;
type ActionHandler<T> = (callback: (data: T, peerId: string) => void) => void;

interface RoomActions {
  sendSyncState: ActionSender<SyncStatePayload>;
  onSyncState: ActionHandler<SyncStatePayload>;
  
  sendPlayerJoin: ActionSender<PlayerJoinPayload>;
  onPlayerJoin: ActionHandler<PlayerJoinPayload>;
  
  sendPlayerLeave: ActionSender<PlayerLeavePayload>;
  onPlayerLeave: ActionHandler<PlayerLeavePayload>;
  
  sendStartGame: ActionSender<StartGamePayload>;
  onStartGame: ActionHandler<StartGamePayload>;
  
  sendCallNumber: ActionSender<CallNumberPayload>;
  onCallNumber: ActionHandler<CallNumberPayload>;
  
  sendNumberCalled: ActionSender<NumberCalledPayload>;
  onNumberCalled: ActionHandler<NumberCalledPayload>;
  
  sendDeclareWinner: ActionSender<DeclareWinnerPayload>;
  onDeclareWinner: ActionHandler<DeclareWinnerPayload>;
  
  sendGameOver: ActionSender<GameOverPayload>;
  onGameOver: ActionHandler<GameOverPayload>;
  
  sendPing: ActionSender<PingPayload>;
  onPing: ActionHandler<PingPayload>;
  
  sendPong: ActionSender<PongPayload>;
  onPong: ActionHandler<PongPayload>;
  
  sendHostTransfer: ActionSender<HostTransferPayload>;
  onHostTransfer: ActionHandler<HostTransferPayload>;
  
  sendError: ActionSender<ErrorPayload>;
  onError: ActionHandler<ErrorPayload>;
}

let actions: RoomActions | null = null;

// ============================================================================
// Event Callbacks
// ============================================================================

type PeerCallback = (peerId: string) => void;
type DisconnectCallback = (peerId: string, threshold: 'reconnecting' | 'disconnected') => void;

let onPeerJoinCallback: PeerCallback | null = null;
let onPeerLeaveCallback: PeerCallback | null = null;
let onPeerDisconnectCallback: DisconnectCallback | null = null;

// ============================================================================
// Room Management
// ============================================================================

/**
 * Creates a new room as host.
 */
export function createRoom(): { roomCode: string; room: Room; actions: RoomActions } {
  if (currentRoom) {
    leaveRoom();
  }

  const roomCode = generateRoomCode();
  const room = trysteroJoinRoom({ appId: APP_ID, relayUrls: TRACKER_URLS }, roomCode);
  
  currentRoom = room;
  currentRoomCode = roomCode;
  actions = createActions(room);
  
  setupRoomEvents(room);
  startPingInterval();
  
  return { roomCode, room, actions };
}

/**
 * Joins an existing room.
 */
export function joinRoom(roomCode: string): { room: Room; actions: RoomActions } {
  if (currentRoom) {
    leaveRoom();
  }

  const normalizedCode = roomCode.toUpperCase().trim();
  const room = trysteroJoinRoom({ appId: APP_ID, relayUrls: TRACKER_URLS }, normalizedCode);
  
  currentRoom = room;
  currentRoomCode = normalizedCode;
  actions = createActions(room);
  
  setupRoomEvents(room);
  startPingInterval();
  
  return { room, actions };
}

/**
 * Leaves the current room.
 */
export function leaveRoom(): void {
  stopPingInterval();
  
  if (currentRoom) {
    currentRoom.leave();
    currentRoom = null;
    currentRoomCode = null;
    actions = null;
  }
  
  peerLastSeen.clear();
}

/**
 * Gets the current room code.
 */
export function getRoomCode(): string | null {
  return currentRoomCode;
}

/**
 * Gets the current room actions.
 */
export function getActions(): RoomActions | null {
  return actions;
}

/**
 * Checks if currently in a room.
 */
export function isInRoom(): boolean {
  return currentRoom !== null;
}

/**
 * Stops tracker reconnection attempts.
 * Call this when the game starts to stop looking for new peers.
 */
export function stopPeerDiscovery(): void {
  pauseRelayReconnection();
}

/**
 * Resumes tracker reconnection attempts.
 * Call this when returning to lobby or creating a new game.
 */
export function resumePeerDiscovery(): void {
  resumeRelayReconnection();
}

// ============================================================================
// Action Setup
// ============================================================================

function createActions(room: Room): RoomActions {
  const [sendSyncState, onSyncState] = room.makeAction<SyncStatePayload>('sync-state');
  const [sendPlayerJoin, onPlayerJoin] = room.makeAction<PlayerJoinPayload>('player-join');
  const [sendPlayerLeave, onPlayerLeave] = room.makeAction<PlayerLeavePayload>('player-leave');
  const [sendStartGame, onStartGame] = room.makeAction<StartGamePayload>('start-game');
  const [sendCallNumber, onCallNumber] = room.makeAction<CallNumberPayload>('call-number');
  const [sendNumberCalled, onNumberCalled] = room.makeAction<NumberCalledPayload>('num-called');
  const [sendDeclareWinner, onDeclareWinner] = room.makeAction<DeclareWinnerPayload>('claim-win');
  const [sendGameOver, onGameOver] = room.makeAction<GameOverPayload>('game-over');
  const [sendPing, onPing] = room.makeAction<PingPayload>('ping');
  const [sendPong, onPong] = room.makeAction<PongPayload>('pong');
  const [sendHostTransfer, onHostTransfer] = room.makeAction<HostTransferPayload>('new-host');
  const [sendError, onError] = room.makeAction<ErrorPayload>('error');
  
  return {
    sendSyncState,
    onSyncState,
    sendPlayerJoin,
    onPlayerJoin,
    sendPlayerLeave,
    onPlayerLeave,
    sendStartGame,
    onStartGame,
    sendCallNumber,
    onCallNumber,
    sendNumberCalled,
    onNumberCalled,
    sendDeclareWinner,
    onDeclareWinner,
    sendGameOver,
    onGameOver,
    sendPing,
    onPing,
    sendPong,
    onPong,
    sendHostTransfer,
    onHostTransfer,
    sendError,
    onError,
  };
}

// ============================================================================
// Room Events
// ============================================================================

function setupRoomEvents(room: Room): void {
  room.onPeerJoin((peerId) => {
    peerLastSeen.set(peerId, Date.now());
    onPeerJoinCallback?.(peerId);
  });
  
  room.onPeerLeave((peerId) => {
    peerLastSeen.delete(peerId);
    onPeerLeaveCallback?.(peerId);
  });
  
  // Setup ping/pong response
  if (actions) {
    actions.onPing((data, peerId) => {
      peerLastSeen.set(peerId, Date.now());
      actions?.sendPong(
        {
          type: 'pong',
          originalTimestamp: data.timestamp,
          respondedAt: Date.now(),
        },
        peerId
      );
    });
    
    actions.onPong((_data, peerId) => {
      peerLastSeen.set(peerId, Date.now());
    });
  }
}

// ============================================================================
// Event Registration
// ============================================================================

export function onPeerJoin(callback: PeerCallback): void {
  onPeerJoinCallback = callback;
}

export function onPeerLeave(callback: PeerCallback): void {
  onPeerLeaveCallback = callback;
}

export function onPeerDisconnect(callback: DisconnectCallback): void {
  onPeerDisconnectCallback = callback;
}

// ============================================================================
// Ping/Pong Heartbeat
// ============================================================================

function startPingInterval(): void {
  stopPingInterval();
  
  pingIntervalId = setInterval(() => {
    if (!actions) return;
    
    // Send ping to all peers
    actions.sendPing({ type: 'ping', timestamp: Date.now() });
    
    // Check for disconnected peers
    const now = Date.now();
    for (const [peerId, lastSeen] of peerLastSeen) {
      const elapsed = now - lastSeen;
      
      if (elapsed >= DISCONNECT_THRESHOLD_MS) {
        onPeerDisconnectCallback?.(peerId, 'disconnected');
      } else if (elapsed >= RECONNECTING_THRESHOLD_MS) {
        onPeerDisconnectCallback?.(peerId, 'reconnecting');
      }
    }
  }, PING_INTERVAL_MS);
}

function stopPingInterval(): void {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all connected peer IDs.
 */
export function getConnectedPeers(): string[] {
  return Array.from(peerLastSeen.keys());
}

/**
 * Gets the last seen timestamp for a peer.
 */
export function getPeerLastSeen(peerId: string): number | undefined {
  return peerLastSeen.get(peerId);
}

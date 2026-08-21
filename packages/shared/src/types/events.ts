import type { ExecutionStatus } from '../executionStatus.js';

/**
 * Event contracts for future streaming / bidirectional pipeline.
 *
 * These types are NOT used in the initial polling-based implementation.
 * They exist so that when WebSocket streaming is added, the event shapes
 * are already defined and agreed upon across services.
 *
 * Adding streaming is ADDITIVE — use these types, don't invent new ones.
 */

/** Sent from Worker → API → Frontend when new output is available. */
export interface ExecutionOutputChunk {
  executionId: string;
  stream: 'stdout' | 'stderr';
  data: string;
  timestamp: string;
}

/** Sent from Worker → API → Frontend when execution status changes. */
export interface ExecutionStatusChange {
  executionId: string;
  previousStatus: ExecutionStatus;
  newStatus: ExecutionStatus;
  timestamp: string;
}

/** Sent from Frontend → API → Worker to provide stdin input. */
export interface ExecutionInputMessage {
  executionId: string;
  data: string;
}

/** Union of all server-to-client event types. */
export type ServerEvent = ExecutionOutputChunk | ExecutionStatusChange;

/** Union of all client-to-server event types. */
export type ClientEvent = ExecutionInputMessage;

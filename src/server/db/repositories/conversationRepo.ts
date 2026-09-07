import { getPool } from '../client';
import type { TravelRequirement } from '../../schemas/travelRequirement';

export type ConversationStatus =
  | 'gathering'
  /** Offered to pass it to the team; waiting on a name and number. */
  | 'awaiting_contact'
  | 'ready' | 'recommended' | 'handed_off' | 'abandoned';

export interface ConversationRow {
  id: string;
  lead_id: string | null;
  session_id: string | null;
  extracted_requirements: TravelRequirement | null;
  status: ConversationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extracted: unknown;
  retrieved_ids: unknown;
  created_at: Date;
}

export async function createConversation(sessionId?: string): Promise<ConversationRow> {
  const { rows } = await getPool().query<ConversationRow>(
    `INSERT INTO conversations (session_id) VALUES ($1) RETURNING *`,
    [sessionId ?? null]
  );
  return rows[0];
}

export async function findConversation(id: string): Promise<ConversationRow | null> {
  const { rows } = await getPool().query<ConversationRow>(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function saveRequirements(
  id: string,
  requirements: TravelRequirement,
  status: ConversationStatus
): Promise<void> {
  await getPool().query(
    `UPDATE conversations
     SET extracted_requirements = $2, status = $3, updated_at = now()
     WHERE id = $1`,
    [id, JSON.stringify(requirements), status]
  );
}

export async function linkLead(conversationId: string, leadId: string | number): Promise<void> {
  await getPool().query(
    `UPDATE conversations SET lead_id = $2, updated_at = now() WHERE id = $1`,
    [conversationId, leadId]
  );
}

export async function appendMessage(args: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extracted?: unknown;
  /** Ids of the rows a recommendation was built from — the audit trail. */
  retrievedIds?: unknown;
  model?: string | null;
  tokenUsage?: unknown;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO conversation_messages
       (conversation_id, role, content, extracted, retrieved_ids, model, token_usage)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      args.conversationId,
      args.role,
      args.content,
      args.extracted ? JSON.stringify(args.extracted) : null,
      args.retrievedIds ? JSON.stringify(args.retrievedIds) : null,
      args.model ?? null,
      args.tokenUsage ? JSON.stringify(args.tokenUsage) : null,
    ]
  );
}

export async function listMessages(conversationId: string): Promise<MessageRow[]> {
  const { rows } = await getPool().query<MessageRow>(
    `SELECT * FROM conversation_messages
     WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return rows;
}

import Anthropic from '@anthropic-ai/sdk';
import { Request, Response } from 'express';
import { reservationRepository } from '../repositories/ReservationRepository';
import { roomRepository } from '../repositories/RoomRepository';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools: Anthropic.Tool[] = [
  {
    name: 'list_rooms',
    description: '登録されている会議室の一覧を取得します。各会議室の名前、場所、定員、設備を含みます。',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_reservations',
    description: '予約一覧を取得します。日付や会議室IDで絞り込みできます。',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: '絞り込む日付 (YYYY-MM-DD形式)。省略すると全件取得。',
        },
        roomId: {
          type: 'string',
          description: '絞り込む会議室ID。省略すると全室。',
        },
      },
      required: [],
    },
  },
  {
    name: 'create_reservation',
    description: '会議室を予約します。必要な情報が揃っている場合のみ呼び出してください。予約者名は自動設定されるため不要です。',
    input_schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: '会議室ID' },
        date: { type: 'string', description: '予約日 (YYYY-MM-DD)' },
        startTime: { type: 'string', description: '開始時刻 (HH:MM)' },
        endTime: { type: 'string', description: '終了時刻 (HH:MM)' },
        attendeeCount: { type: 'number', description: '参加人数' },
        meetingName: { type: 'string', description: '会議名' },
        participants: { type: 'string', description: '参加者（任意、カンマ区切り）' },
      },
      required: ['roomId', 'date', 'startTime', 'endTime', 'attendeeCount', 'meetingName'],
    },
  },
];

type ToolName = 'list_rooms' | 'list_reservations' | 'create_reservation';

interface ListReservationsInput {
  date?: string;
  roomId?: string;
}

interface CreateReservationInput {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  meetingName: string;
  participants?: string;
}

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

async function runTool(name: ToolName, input: unknown, reservedBy: string, isAdmin: boolean): Promise<unknown> {
  if (name === 'list_rooms') {
    return roomRepository.findAll();
  }

  if (name === 'list_reservations') {
    const { date, roomId } = input as ListReservationsInput;
    let reservations = reservationRepository.findAll();
    if (date) reservations = reservations.filter((r) => r.date === date);
    if (roomId) reservations = reservations.filter((r) => r.roomId === roomId);
    const rooms = roomRepository.findAll();
    return reservations.map((r) => {
      const roomName = rooms.find((rm) => rm.id === r.roomId)?.name ?? r.roomId;
      if (isAdmin) return { ...r, roomName };
      return { roomId: r.roomId, roomName, date: r.date, startTime: r.startTime, endTime: r.endTime };
    });
  }

  if (name === 'create_reservation') {
    const data = input as CreateReservationInput;
    const room = roomRepository.findById(data.roomId);
    if (!room) return { error: '指定の会議室が存在しません' };

    if (data.attendeeCount > room.capacity) {
      return { error: `参加人数（${data.attendeeCount}名）が定員（${room.capacity}名）を超えています` };
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (data.date < today) return { error: '過去の日付には予約できません' };
    if (data.date === today && toMins(data.startTime) <= now.getHours() * 60 + now.getMinutes()) {
      return { error: '開始時刻がすでに過去です' };
    }
    if (toMins(data.endTime) <= toMins(data.startTime)) {
      return { error: '終了時刻は開始時刻より後にしてください' };
    }

    const existing = reservationRepository.findAll();
    const conflict = existing.find((r) => {
      if (r.roomId !== data.roomId || r.date !== data.date) return false;
      const aStart = toMins(r.startTime);
      const aEnd = toMins(r.endTime);
      const bStart = toMins(data.startTime);
      const bEnd = toMins(data.endTime);
      return aStart < bEnd && bStart < aEnd;
    });
    if (conflict) return { error: '指定の日時はすでに予約が入っています' };

    const saved = await reservationRepository.create({
      roomId: data.roomId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      attendeeCount: data.attendeeCount,
      meetingName: data.meetingName,
      reservedBy,
      participants: data.participants ?? '',
    });
    return { success: true, reservation: saved };
  }

  return { error: '不明なツール' };
}

const SYSTEM_PROMPT = `あなたは会議室予約サポートAIです。ユーザーが自然言語で会議室の空き確認や予約を行えるよう支援します。

ツールを使って会議室情報や予約状況を調べ、予約に必要な情報が揃ったら create_reservation を呼び出してください。

予約に必要な情報（ユーザーに確認すべき項目）:
- 会議室（空き状況を確認して候補を提示してください）
- 日付
- 開始・終了時刻
- 参加人数
- 会議名

予約者名は「{RESERVED_BY}」に自動設定されます。絶対にユーザーへ聞かないでください。

日付は必ずYYYY-MM-DD形式、時刻はHH:MM形式で扱ってください。
今日の日付は {TODAY} です。
足りない情報は丁寧に聞いてください。`;

export const chatController = {
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { messages } = req.body as { messages: Anthropic.MessageParam[] };
      const reservedBy = req.user!.username;
      const isAdmin = req.user!.role === 'admin';

      if (!process.env.ANTHROPIC_API_KEY) {
        res.status(503).json({ error: 'ANTHROPIC_API_KEY が設定されていません' });
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const system = SYSTEM_PROMPT
        .replace('{TODAY}', today)
        .replace('{RESERVED_BY}', reservedBy);

      const runMessages = [...messages] as Anthropic.MessageParam[];

      for (let i = 0; i < 10; i++) {
        const response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system,
          tools,
          messages: runMessages,
        });

        runMessages.push({ role: 'assistant', content: response.content });

        if (response.stop_reason !== 'tool_use') {
          const text = response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('');
          res.json({ reply: text, messages: runMessages });
          return;
        }

        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );
        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          toolUseBlocks.map(async (block) => ({
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(await runTool(block.name as ToolName, block.input, reservedBy, isAdmin)),
          })),
        );

        runMessages.push({ role: 'user', content: toolResults });
      }

      res.status(500).json({ error: 'ループ上限に達しました' });
    } catch (e) {
      console.error('[ChatController]', e);
      res.status(500).json({ error: (e as Error).message });
    }
  },
};

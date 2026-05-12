import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '../api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MIN_W = 280;
const MIN_H = 300;
const DEFAULT_W = 384;
const DEFAULT_H = 480;

const HANDLES = [
  { dir: 'n',  cls: 'top-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { dir: 'ne', cls: 'top-0 right-0 size-4 cursor-nesw-resize' },
  { dir: 'e',  cls: 'top-4 bottom-4 right-0 w-1.5 cursor-ew-resize' },
  { dir: 'se', cls: 'bottom-0 right-0 size-4 cursor-nwse-resize' },
  { dir: 's',  cls: 'bottom-0 left-4 right-4 h-1.5 cursor-ns-resize' },
  { dir: 'sw', cls: 'bottom-0 left-0 size-4 cursor-nesw-resize' },
  { dir: 'w',  cls: 'top-4 bottom-4 left-0 w-1.5 cursor-ew-resize' },
  { dir: 'nw', cls: 'top-0 left-0 size-4 cursor-nwse-resize' },
] as const;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function defaultPos(w: number, h: number) {
  return { x: window.innerWidth - w - 20, y: window.innerHeight - h - 80 };
}

function loadPanelState() {
  try {
    const pos = localStorage.getItem('chatPanel.pos');
    const size = localStorage.getItem('chatPanel.size');
    return {
      pos: pos ? JSON.parse(pos) : defaultPos(DEFAULT_W, DEFAULT_H),
      size: size ? JSON.parse(size) : { width: DEFAULT_W, height: DEFAULT_H },
    };
  } catch {
    return { pos: defaultPos(DEFAULT_W, DEFAULT_H), size: { width: DEFAULT_W, height: DEFAULT_H } };
  }
}

const ChatPanel: FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [pos, setPos] = useState(() => loadPanelState().pos);
  const [size, setSize] = useState(() => loadPanelState().size);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ドラッグ・リサイズの開始時スナップショットをrefで保持（stale closureを避けるため）
  const dragRef = useRef<{
    type: 'move' | 'resize';
    dir?: string;
    startMX: number; startMY: number;
    startX: number; startY: number;
    startW: number; startH: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('chatPanel.pos', JSON.stringify(pos));
  }, [pos]);

  useEffect(() => {
    localStorage.setItem('chatPanel.size', JSON.stringify(size));
  }, [size]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startMX;
      const dy = e.clientY - d.startMY;

      if (d.type === 'move') {
        setPos({
          x: clamp(d.startX + dx, 0, window.innerWidth - d.startW),
          y: clamp(d.startY + dy, 0, window.innerHeight - d.startH),
        });
        return;
      }

      const dir = d.dir ?? '';
      let x = d.startX, y = d.startY, w = d.startW, h = d.startH;

      if (dir.includes('e')) w = Math.max(MIN_W, d.startW + dx);
      if (dir.includes('s')) h = Math.max(MIN_H, d.startH + dy);
      if (dir.includes('w')) { w = Math.max(MIN_W, d.startW - dx); x = d.startX + d.startW - w; }
      if (dir.includes('n')) { h = Math.max(MIN_H, d.startH - dy); y = d.startY + d.startH - h; }

      x = clamp(x, 0, window.innerWidth - MIN_W);
      y = clamp(y, 0, window.innerHeight - MIN_H);
      w = Math.min(w, window.innerWidth - x);
      h = Math.min(h, window.innerHeight - y);

      setPos({ x, y });
      setSize({ width: w, height: h });
    };

    const onUp = () => { dragRef.current = null; };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      type: 'move',
      startMX: e.clientX, startMY: e.clientY,
      startX: pos.x, startY: pos.y,
      startW: size.width, startH: size.height,
    };
  };

  const startResize = (e: React.MouseEvent, dir: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: 'resize', dir,
      startMX: e.clientX, startMY: e.clientY,
      startX: pos.x, startY: pos.y,
      startW: size.width, startH: size.height,
    };
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await api.chat(next);
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* トグルボタン */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full shadow-lg transition-colors',
          open ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500',
        )}
        aria-label="AIチャットを開く"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* チャットパネル */}
      {open && (
        <div
          className="fixed z-40 flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl"
          style={{ left: pos.x, top: pos.y, width: size.width, height: size.height }}
        >
          {/* リサイズハンドル（全8方向） */}
          {HANDLES.map(({ dir, cls }) => (
            <div
              key={dir}
              className={cn('absolute z-10', cls)}
              onMouseDown={(e) => startResize(e, dir)}
            />
          ))}

          {/* ヘッダー（ドラッグ移動） */}
          <div
            className="flex items-center gap-2 rounded-t-xl bg-blue-600 px-4 py-3 cursor-grab active:cursor-grabbing select-none shrink-0"
            onMouseDown={startDrag}
          >
            <MessageCircle size={16} className="text-white" />
            <span className="text-sm font-semibold text-white">AIアシスタント</span>
            <span className="ml-auto text-[11px] text-blue-200">会議室予約サポート</span>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">
                「今日の10時から30分、1on1できる会議室は？」のように話しかけてください。
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed',
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm',
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={15} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 入力欄 */}
          <div className="border-t border-slate-100 p-3 flex gap-2 items-end shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力… (Enter で送信)"
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 max-h-28 overflow-y-auto"
              style={{ minHeight: '36px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 112) + 'px';
              }}
            />
            <Button
              type="button"
              size="icon-sm"
              disabled={!input.trim() || loading}
              onClick={send}
              className="shrink-0"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;

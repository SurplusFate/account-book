// 账号本子 - 轻量 Toast 通知
import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (type: ToastType, message: string) => void;
  remove: (id: number) => void;
}

let counter = 0;
export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = 'info') {
  useToast.getState().push(type, message);
}

const config: Record<ToastType, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-success' },
  error: { icon: AlertCircle, color: 'text-danger' },
  info: { icon: Info, color: 'text-amber-400' },
};

function ToastCard({ item }: { item: ToastItem }) {
  const remove = useToast((s) => s.remove);
  const { icon: Icon, color } = config[item.type];
  useEffect(() => {}, []);
  return (
    <div className="animate-rise flex items-center gap-3 rounded-xl border border-cream/10 bg-ink-800/95 px-4 py-3 shadow-card backdrop-blur-md">
      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
      <span className="text-sm text-cream">{item.message}</span>
      <button
        onClick={() => remove(item.id)}
        className="ml-2 text-cream-dim transition-colors hover:text-cream"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard item={t} />
        </div>
      ))}
    </div>
  );
}

// 账号本子 - 确认对话框
import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-md p-6 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          {danger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-serif text-lg font-semibold text-cream">{title}</h3>
            {description && (
              <div className="mt-1.5 text-sm text-cream-muted">{description}</div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

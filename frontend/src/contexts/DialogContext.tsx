import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, LucideIcon, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';
export type ConfirmVariant = 'default' | 'destructive';

interface DialogState {
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  alertVariant: AlertVariant;
  confirmVariant: ConfirmVariant;
  confirmLabel: string;
}

interface DialogContextValue {
  alert: (message: string, title?: string, variant?: AlertVariant) => Promise<void>;
  confirm: (message: string, options?: { title?: string; confirmLabel?: string; variant?: ConfirmVariant }) => Promise<boolean>;
}

const ALERT_CONFIG: Record<AlertVariant, {
  Icon: LucideIcon;
  iconClass: string;
  titleClass: string;
  borderClass: string;
}> = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'text-green-500',
    titleClass: 'text-green-700',
    borderClass: 'border-t-4 border-t-green-500',
  },
  error: {
    Icon: XCircle,
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
    borderClass: 'border-t-4 border-t-destructive',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-amber-500',
    titleClass: 'text-amber-700',
    borderClass: 'border-t-4 border-t-amber-500',
  },
  info: {
    Icon: Info,
    iconClass: 'text-blue-500',
    titleClass: 'text-blue-700',
    borderClass: 'border-t-4 border-t-blue-500',
  },
};

const CONFIRM_CONFIG: Record<ConfirmVariant, {
  Icon: LucideIcon;
  iconClass: string;
  titleClass: string;
  borderClass: string;
  actionClass: string;
}> = {
  destructive: {
    Icon: AlertTriangle,
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
    borderClass: 'border-t-4 border-t-destructive',
    actionClass: 'bg-destructive text-white hover:bg-destructive/90',
  },
  default: {
    Icon: HelpCircle,
    iconClass: 'text-slate-500',
    titleClass: 'text-slate-700',
    borderClass: 'border-t-4 border-t-slate-400',
    actionClass: '',
  },
};

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const openDialog = useCallback((state: DialogState): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog(state);
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setDialog(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setDialog(null);
  };

  const alert = useCallback(
    (message: string, title = 'お知らせ', variant: AlertVariant = 'info') =>
      openDialog({
        type: 'alert',
        title,
        message,
        alertVariant: variant,
        confirmVariant: 'default',
        confirmLabel: 'OK',
      }).then(() => undefined),
    [openDialog],
  );

  const confirm = useCallback(
    (
      message: string,
      { title = '確認', confirmLabel = '実行', variant = 'default' }: { title?: string; confirmLabel?: string; variant?: ConfirmVariant } = {},
    ) =>
      openDialog({
        type: 'confirm',
        title,
        message,
        alertVariant: 'info',
        confirmVariant: variant,
        confirmLabel,
      }),
    [openDialog],
  );

  const renderDialog = () => {
    if (!dialog) return null;

    if (dialog.type === 'alert') {
      const cfg = ALERT_CONFIG[dialog.alertVariant];
      return (
        <AlertDialog open>
          <AlertDialogContent className={cfg.borderClass}>
            <AlertDialogHeader>
              <AlertDialogTitle className={`flex items-center gap-2 ${cfg.titleClass}`}>
                <cfg.Icon className={`shrink-0 ${cfg.iconClass}`} size={18} />
                {dialog.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-wrap">
                {dialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleConfirm}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    const cfg = CONFIRM_CONFIG[dialog.confirmVariant];
    return (
      <AlertDialog open>
        <AlertDialogContent className={cfg.borderClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${cfg.titleClass}`}>
              <cfg.Icon className={`shrink-0 ${cfg.iconClass}`} size={18} />
              {dialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {dialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cfg.actionClass || undefined}
            >
              {dialog.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {renderDialog()}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

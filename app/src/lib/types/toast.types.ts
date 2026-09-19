export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
}

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: ToastAction;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  action?: ToastAction;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export interface ConfirmDialogState extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

import type {
  Toast,
  ToastType,
  ToastOptions,
  ConfirmOptions,
  ConfirmDialogState,
} from '$lib/types/toast.types';

export class ToastState {
  toasts = $state<Toast[]>([]);
  confirmDialog = $state<ConfirmDialogState | null>(null);

  add(message: string, type: ToastType = 'info', options?: ToastOptions): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = options?.duration ?? 4000;

    const toastItem: Toast = {
      id,
      type,
      title: options?.title,
      message,
      duration,
      action: options?.action,
    };

    this.toasts = [...this.toasts, toastItem];

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, options?: ToastOptions): string {
    return this.add(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): string {
    return this.add(message, 'error', { duration: 5000, ...options });
  }

  info(message: string, options?: ToastOptions): string {
    return this.add(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions): string {
    return this.add(message, 'warning', options);
  }

  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmDialog = {
        id: `confirm-${Date.now()}`,
        title: options.title ?? 'Confirm Action',
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        variant: options.variant ?? 'default',
        resolve: (value: boolean) => {
          this.confirmDialog = null;
          resolve(value);
        },
      };
    });
  }
}

export const toast = new ToastState();

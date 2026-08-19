/**
 * Tiny global toast store (framework-free): any client module — storefront or
 * admin — can call `toast.success("...")` without needing a context consumer.
 * ToastViewport subscribes via useSyncExternalStore and renders the stack.
 */

const listeners = new Set();
let toasts = [];

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

export function dismissToast(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function pushToast({ message, tone = "success", duration = 2600 }) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, message, tone, leaving: false }];
  emit();

  window.setTimeout(() => {
    toasts = toasts.map((item) => (item.id === id ? { ...item, leaving: true } : item));
    emit();
    window.setTimeout(() => {
      toasts = toasts.filter((item) => item.id !== id);
      emit();
    }, 220);
  }, duration);

  return id;
}

export const toast = {
  success: (message) => pushToast({ message, tone: "success" }),
  error: (message) => pushToast({ message, tone: "error", duration: 3600 }),
  info: (message) => pushToast({ message, tone: "info", duration: 3000 }),
};
"use client";

import { useSyncExternalStore } from "react";
import { Check, Info, X, XCircle } from "lucide-react";

import { dismissToast, getToasts, subscribe } from "./toast-store";
import "./toast.css";

const TONE_ICON = {
  success: Check,
  info: Info,
  error: XCircle,
};

export default function ToastViewport() {
  const toasts = useSyncExternalStore(subscribe, getToasts, getToasts);

  return (
    <div className="bb-toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => {
        const Icon = TONE_ICON[item.tone] || Check;
        return (
          <div
            key={item.id}
            className={`bb-toast bb-toast--${item.tone}${item.leaving ? " is-leaving" : ""}`}
            role="status"
          >
            <span className="bb-toast__icon">
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="bb-toast__message">{item.message}</p>
            <button
              type="button"
              className="bb-toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(item.id)}
            >
              <X size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
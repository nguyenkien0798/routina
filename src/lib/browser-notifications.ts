import { APP_NAME } from "@/lib/constants";
import {
  summarizeNotifications,
  type AppNotification,
} from "@/lib/app-notifications";

export type BrowserPermission = NotificationPermission | "unsupported";

export function getBrowserNotificationPermission(): BrowserPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

function attachClick(notification: Notification, onClickPath?: string) {
  notification.onclick = () => {
    window.focus();
    if (onClickPath) {
      window.location.assign(onClickPath);
    }
    notification.close();
  };
}

/** Only fires while this document/tab is open — no service worker. */
export function showBrowserDigest(
  items: AppNotification[],
  onClickPath?: string,
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;
  if (items.length === 0) return null;

  const notification = new Notification(APP_NAME, {
    body: summarizeNotifications(items),
    tag: "routina-digest",
  });
  attachClick(notification, onClickPath);
  return notification;
}

/** Timed reminder for a single task while the app tab is open. */
export function showBrowserAlert(
  title: string,
  body: string,
  tag: string,
  onClickPath = "/tasks",
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const notification = new Notification(title, {
    body,
    tag,
  });
  attachClick(notification, onClickPath);
  return notification;
}

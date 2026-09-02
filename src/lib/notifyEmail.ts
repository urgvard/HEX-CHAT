export type NotificationEventType = 'new_member' | 'new_dm' | 'new_notice';

/**
 * Fire-and-forget request to the notify Netlify function. Never throws --
 * an email notification failing must never block the action that triggered
 * it (registering, sending a message, posting a notice).
 */
export async function triggerNotificationEmail(
  idToken: string,
  type: NotificationEventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch('/.netlify/functions/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, type, payload })
    });
  } catch (e) {
    console.warn('Notification email request failed', e);
  }
}

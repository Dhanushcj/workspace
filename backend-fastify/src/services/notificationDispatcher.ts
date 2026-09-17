import { getFirestore } from 'firebase-admin/firestore';
import { User } from '../models/User';
import { sendWebPush } from './webPush';
import { getApps } from 'firebase-admin/app';

// Ensure Firebase has been initialized before calling this
// pushNotifications.ts handles the initialization.

/**
 * Dispatches both Web Push and Firebase Email notifications for assignment events.
 */
export async function notifyAssignment(
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Send Web Push if they have subscriptions
    if (user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
      await sendWebPush([user.email], { title, body, url });
    }

    // 2. Send Firebase Email
    if (getApps().length > 0) {
      const db = getFirestore();
      const targetEmail = user.notificationEmail || user.email;
      
      if (targetEmail) {
        await db.collection('mail').add({
          to: targetEmail,
          message: {
            subject: title,
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">${title}</h2>
                <p style="font-size: 16px; color: #334155;">${body}</p>
                <div style="margin-top: 30px;">
                  <a href="${url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                </div>
              </div>
            `
          },
          createdAt: new Date()
        });
        console.log(`[NotificationDispatcher] Queued Firebase email for ${targetEmail}`);
      }
    } else {
      console.warn('[NotificationDispatcher] Firebase Admin not initialized, skipping email dispatch.');
    }
  } catch (error) {
    console.error('[NotificationDispatcher] Failed to dispatch notifications:', error);
  }
}

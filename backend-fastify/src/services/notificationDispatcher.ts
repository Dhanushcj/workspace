import { getFirestore } from 'firebase-admin/firestore';
import { User } from '../models/User';
import { sendWebPush } from './webPush';
import { getApps } from 'firebase-admin/app';
import './pushNotifications';

// Ensure Firebase has been initialized before calling this
// pushNotifications.ts handles the initialization.

/**
 * Dispatches both Web Push and Firebase Email notifications for assignment events.
 */
export async function notifyAssignment(
  userId: string,
  title: string,
  body: string,
  url: string,
  detailedHtml?: string
): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // 1. Send Web Push if they have subscriptions
    if (user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
      await sendWebPush([user.email], { title, body, url });
    }

    // 2. Send Email via Brevo (replaces Firebase Extension)
    const targetEmail = user.notificationEmail || user.email;
    if (targetEmail) {
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!brevoApiKey) {
        console.error('[NotificationDispatcher] Missing BREVO_API_KEY in environment variables.');
        return;
      }
      
      // Handle relative URLs by prepending the frontend domain if necessary
      // Assuming tasks are opened on the frontend, let's use a standard domain or just the relative URL if frontend appends it.
      // But since it's an email, it MUST be absolute. We can fallback to the VITE_NEXUS_PM_URL or a default.
      const baseUrl = process.env.VITE_NEXUS_PM_URL || 'http://localhost:3050';
      const absoluteUrl = url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}/w/forge-india-connect/dashboard/member?tab=Sprint%20Board`; // Using Sprint Board as a safe fallback for task URLs
      
      const payload = {
        sender: { name: "Forge PMT", email: "forgeindiaconnectfic@gmail.com" },
        to: [{ email: targetEmail, name: user.name || 'User' }],
        subject: title,
        htmlContent: detailedHtml || `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">${title}</h2>
            <p style="font-size: 16px; color: #334155;">${body}</p>
            <div style="margin-top: 30px;">
              <a href="${absoluteUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Details</a>
            </div>
          </div>
        `
      };

      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log(`[NotificationDispatcher] Sent Brevo email to ${targetEmail}`);
        } else {
          const errData = await response.text();
          console.error('[NotificationDispatcher] Failed to send Brevo email:', errData);
        }
      } catch (err) {
        console.error('[NotificationDispatcher] Network error sending Brevo email:', err);
      }
    }
  } catch (error) {
    console.error('[NotificationDispatcher] Failed to dispatch notifications:', error);
  }
}

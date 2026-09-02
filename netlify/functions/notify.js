// Sends transactional email notifications (new membership application, new DM,
// new notice) via Resend. Runs server-side on Netlify so RESEND_API_KEY and the
// Firebase service account never reach the browser.
//
// The caller's Firebase ID token is verified with firebase-admin before doing
// anything -- everything this function sends is then derived by reading
// Firestore directly (as the sender, the recipient's own notification
// preference, the actual latest message/notice) rather than trusting the
// request body's content, so a signed-in member can't spoof what an email says
// or who it appears to be from.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_EMAIL = 'urgvard@gmail.com';
const APP_URL = 'https://hex-chat-975.netlify.app';
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || 'HEX CHAT <onboarding@resend.dev>';

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  return initializeApp({ credential: cert(serviceAccount) });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { idToken, type, payload } = body;
  if (!idToken || !type) {
    return { statusCode: 400, body: 'Missing idToken or type' };
  }

  const app = getAdminApp();
  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(idToken);
  } catch {
    return { statusCode: 401, body: 'Invalid ID token' };
  }

  const db = getFirestore(app);
  const senderUid = decoded.uid;

  try {
    if (type === 'new_member') {
      const applicantDoc = await db.collection('users').doc(senderUid).get();
      const applicant = applicantDoc.exists
        ? applicantDoc.data()
        : { displayName: decoded.email, email: decoded.email };

      await sendEmail(
        ADMIN_EMAIL,
        'New HEX CHAT membership application',
        `<p><strong>${escapeHtml(applicant.displayName)}</strong> (${escapeHtml(applicant.email)}) just applied to join HEX CHAT.</p>
         <p>Approve them from the Directory tab: <a href="${APP_URL}">${APP_URL}</a></p>`
      );
    } else if (type === 'new_dm') {
      const recipientUid = payload?.recipientUid;
      if (!recipientUid || typeof recipientUid !== 'string') {
        return { statusCode: 400, body: 'Missing recipientUid' };
      }

      const recipientDoc = await db.collection('users').doc(recipientUid).get();
      if (!recipientDoc.exists || !recipientDoc.data().notifyOnDMs || !recipientDoc.data().email) {
        return { statusCode: 200, body: 'skipped' };
      }
      const recipient = recipientDoc.data();

      const senderDoc = await db.collection('users').doc(senderUid).get();
      const senderName = senderDoc.exists ? senderDoc.data().displayName : decoded.email || 'A member';

      const conversationId = [senderUid, recipientUid].sort().join('_');
      const lastMsgSnap = await db
        .collection('conversations').doc(conversationId).collection('messages')
        .orderBy('timestamp', 'desc').limit(1).get();
      const lastMsg = lastMsgSnap.docs[0]?.data();
      const preview = lastMsg?.text || (lastMsg?.fileName ? `Attachment: ${lastMsg.fileName}` : 'New message');

      await sendEmail(
        recipient.email,
        `New message from ${senderName} on HEX CHAT`,
        `<p><strong>${escapeHtml(senderName)}</strong> sent you a message:</p>
         <p style="padding:12px;background:#f1f5f9;border-radius:8px;">${escapeHtml(preview)}</p>
         <p><a href="${APP_URL}">Reply on HEX CHAT</a></p>`
      );
    } else if (type === 'new_notice') {
      // Only an admin can actually create a notice (enforced by Firestore rules),
      // so it's safe to fan this out to every opted-in member based on the
      // caller's say-so that a notice now exists.
      const noticeSnap = await db.collection('notice_board').orderBy('createdAt', 'desc').limit(1).get();
      const notice = noticeSnap.docs[0]?.data();
      if (!notice) return { statusCode: 200, body: 'skipped' };

      const recipientsSnap = await db.collection('users').where('notifyOnNotices', '==', true).get();
      const recipients = recipientsSnap.docs.map((d) => d.data().email).filter(Boolean);

      await Promise.all(
        recipients.map((to) =>
          sendEmail(
            to,
            `New notice on HEX CHAT: ${notice.title}`,
            `<p><strong>${escapeHtml(notice.title)}</strong></p>
             <p>${escapeHtml(String(notice.content).slice(0, 300))}</p>
             <p><a href="${APP_URL}">Read it on HEX CHAT</a></p>`
          ).catch((err) => console.error('Failed to email', to, err))
        )
      );
    } else {
      return { statusCode: 400, body: 'Unknown type' };
    }
  } catch (err) {
    console.error('notify function error', err);
    return { statusCode: 500, body: 'Failed to send notification' };
  }

  return { statusCode: 200, body: 'ok' };
};

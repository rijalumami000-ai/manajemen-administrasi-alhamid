import path from 'path';
import fs from 'fs';
import db from '../../db';

let admin: any;
let getMessaging: any;
try {
  admin = require('firebase-admin');
  try {
    getMessaging = require('firebase-admin/messaging').getMessaging;
  } catch (e) {
    // Older firebase-admin might not have modular messaging exports
  }
} catch (e) {
  // Safe load if package is not yet fully installed synchronously
}

let fcmInitialized = false;

// Initialize Firebase Admin SDK
export function initFCM(): boolean {
  if (fcmInitialized) return true;
  if (!admin) {
    try {
      admin = require('firebase-admin');
    } catch (e) {
      console.warn('⚠ firebase-admin package is not available.');
      return false;
    }
  }

  try {
    const serviceAccountPath = path.join(__dirname, '../../config/firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential ? admin.credential.cert(serviceAccount) : admin.cert(serviceAccount)
      });
      fcmInitialized = true;
      console.log('✓ Firebase Admin SDK initialized for FCM');
      return true;
    } else {
      console.warn('⚠ Firebase service account file not found at config/firebase-service-account.json. Realtime push notifications will be bypassed (only in-app saved).');
      return false;
    }
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin:', err);
    return false;
  }
}

export interface SendNotificationParams {
  title: string;
  body: string;
  category?: string;
  target: string | number;
  data?: Record<string, any>;
}

export async function sendNotification({ title, body, category, target, data }: SendNotificationParams): Promise<any> {
  // 1. Identify target guru IDs
  let guruIds: number[] = [];
  if (target === 'all') {
    const result = await db.query("SELECT id FROM guru WHERE LOWER(status) = 'aktif' AND mymustahiq_username IS NOT NULL");
    guruIds = result.rows.map((r: { id: number }) => r.id);
  } else if (target === 'mustahiq') {
    const result = await db.query("SELECT id FROM guru WHERE LOWER(status) = 'aktif' AND jabatan_id = 1 AND mymustahiq_username IS NOT NULL");
    guruIds = result.rows.map((r: { id: number }) => r.id);
  } else if (target === 'munawib') {
    const result = await db.query("SELECT id FROM guru WHERE LOWER(status) = 'aktif' AND jabatan_id = 2 AND mymustahiq_username IS NOT NULL");
    guruIds = result.rows.map((r: { id: number }) => r.id);
  } else if (Number.isInteger(target)) {
    guruIds = [target as number];
  } else {
    // If it's a string representing ID
    const parsedId = parseInt(target as string, 10);
    if (!isNaN(parsedId)) {
      guruIds = [parsedId];
    }
  }

  if (guruIds.length === 0) return { success: true, sentCount: 0 };

  // 2. Insert into notifications table (in-app notifications)
  if (category !== 'Chat') {
    for (const guruId of guruIds) {
      await db.query(
        `INSERT INTO notifications (guru_id, title, body, category, is_read, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())`,
        [guruId, title, body, category || 'Pengumuman']
      );
    }
  }

  // 3. Send via FCM
  const hasFCM = initFCM();
  if (!hasFCM) {
    return { success: true, inAppOnly: true, sentCount: guruIds.length };
  }

  // Get Messaging Instance dynamically to support v14+ and older versions
  let messagingInstance: any;
  if (getMessaging) {
    try {
      messagingInstance = getMessaging();
    } catch (_) {}
  }
  if (!messagingInstance && admin && typeof admin.messaging === 'function') {
    messagingInstance = admin.messaging();
  }

  if (!messagingInstance) {
    console.warn('⚠ Firebase Messaging is not available.');
    return { success: true, inAppOnly: true, sentCount: guruIds.length };
  }

  // Get FCM tokens for these gurus
  const tokenResult = await db.query(
    `SELECT token, guru_id FROM fcm_tokens WHERE guru_id = ANY($1)`,
    [guruIds]
  );

  if (tokenResult.rows.length === 0) {
    return { success: true, sentCount: 0, message: 'No registered FCM tokens found.' };
  }

  const tokens = tokenResult.rows.map((r: { token: string }) => r.token);
  
  // Send multicast message
  try {
    const fcmData = Object.keys(data || {}).reduce((acc: Record<string, string>, key: string) => {
      acc[key] = String(data![key]);
      return acc;
    }, {
      category: category || 'Pengumuman',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    });

    let soundName = 'default';
    let channelId = 'high_importance_channel';
    const catLower = (category || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();

    if (catLower.includes('jadwal') || titleLower.includes('jadwal')) {
      soundName = 'jadwal';
      channelId = 'jadwal_importance_channel';
    } else if (catLower.includes('chat') || catLower.includes('pesan') || titleLower.includes('pesan')) {
      soundName = 'pesan_masuk';
      channelId = 'pesan_masuk_importance_channel';
    }

    const response = await messagingInstance.sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      data: fcmData,
      android: {
        priority: 'high',
        notification: {
          sound: soundName,
          channelId: channelId,
          priority: 'high',
        }
      }
    });

    console.log(`[FCM] Sent notifications: ${response.successCount} successful, ${response.failureCount} failed.`);
    
    // Clean up expired/invalid tokens
    if (response.failureCount > 0) {
      const tokensToDelete: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
            tokensToDelete.push(tokens[idx]);
          }
        }
      });
      if (tokensToDelete.length > 0) {
        await db.query(`DELETE FROM fcm_tokens WHERE token = ANY($1)`, [tokensToDelete]);
        console.log(`[FCM] Cleaned up ${tokensToDelete.length} invalid tokens.`);
      }
    }

    return { success: true, sentCount: response.successCount };
  } catch (err: any) {
    console.error('[FCM] Error sending multicast notification:', err);
    return { success: false, error: err.message };
  }
}

const notificationService = {
  initFCM,
  sendNotification
};

module.exports = notificationService;
export default notificationService;

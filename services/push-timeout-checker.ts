import cron from 'node-cron';
import { PushRecord } from '../models/PushRecord';

/**
 * Checks for pending push records that have exceeded their timeout window.
 * Runs every 30 minutes. Records that timeout are marked for escalation
 * to the Tower operations backend.
 */
async function checkPushTimeouts() {
  try {
    const now = new Date();

    const timedOutRecords = await PushRecord.updateMany(
      {
        status: 'pending',
        timeoutAt: { $lte: now },
      },
      {
        $set: { status: 'timeout' },
      }
    );

    if (timedOutRecords.modifiedCount > 0) {
      console.log(
        `[PushTimeoutChecker] Marked ${timedOutRecords.modifiedCount} record(s) as timeout`
      );
    }
  } catch (err) {
    console.error('[PushTimeoutChecker] Error:', (err as Error).message);
  }
}

/**
 * Initialize the push timeout checker cron job.
 * Runs every 30 minutes to detect expired pending push records.
 */
export function initPushTimeoutChecker() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('[PushTimeoutChecker] Running timeout check...');
    checkPushTimeouts();
  });

  // Also run once on startup after a short delay
  setTimeout(() => {
    console.log('[PushTimeoutChecker] Initial timeout check on startup...');
    checkPushTimeouts();
  }, 5000);

  console.log('[PushTimeoutChecker] Initialized - checking every 30 minutes');
}

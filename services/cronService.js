const cron = require('node-cron');
const ActionItem = require('../models/ActionItem');
const { sendReminder } = require('./emailService');

/** Runs reminder and overdue-status maintenance once daily at 9 AM. */
function startCron() {
  cron.schedule('0 9 * * *', async () => {
    console.log(`Cron job running at ${new Date().toISOString()}`);
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const start = new Date(today); start.setDate(start.getDate() + 1);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      const dueTomorrow = await ActionItem.find({ deadline: { $gte: start, $lte: end }, status: 'pending', reminderSent: false }).populate('meetingId');
      for (const item of dueTomorrow) {
        try { await sendReminder(item); item.reminderSent = true; await item.save(); console.log(`Reminder sent for action item ${item._id}`); }
        catch (error) { console.error(`Reminder failed for ${item._id}:`, error.message); }
      }
      await ActionItem.updateMany({ deadline: { $lt: today }, status: 'pending' }, { $set: { status: 'overdue' } });
    } catch (error) { console.error('Cron job failed:', error.message); }
  });
}
module.exports = { startCron };

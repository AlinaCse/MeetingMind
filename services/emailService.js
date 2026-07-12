const nodemailer = require('nodemailer');

/** Sends a deadline reminder to an action item's owner. */
async function sendReminder(item) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error('Email credentials are not configured');
  if (!item.ownerEmail) throw new Error('Action item has no owner email');
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
  const deadline = new Date(item.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: item.ownerEmail,
    subject: 'Reminder — Task due tomorrow',
    text: `Hi ${item.owner},\n\nThis is a reminder that the following task is due tomorrow:\n\nTask: ${item.task}\nDeadline: ${deadline}\nMeeting: ${item.meetingId.title}\n\nPlease make sure to complete it on time.\n\nMeetingMind`
  });
}
module.exports = { sendReminder };

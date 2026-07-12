const ActionItem = require('../models/ActionItem');

/** Lists all current user's action items with their meetings. */
exports.index = async (req, res) => {
  try {
    const actionItems = await ActionItem.find({ userId: req.session.userId }).populate('meetingId').sort({ deadline: 1 });
    res.render('actionItems/index', { title: 'Action Items', actionItems });
  } catch (error) { req.flash('error', error.message); res.redirect('/dashboard'); }
};
/** Marks one owned action item as complete. */
exports.markDone = async (req, res) => {
  try {
    const item = await ActionItem.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, { status: 'done' });
    if (!item) throw new Error('Action item not found.');
    req.flash('success', 'Action item marked as done.'); res.redirect(req.get('referer') || '/actionItems');
  } catch (error) { req.flash('error', error.message); res.redirect('/actionItems'); }
};

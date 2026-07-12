const Meeting = require('../models/Meeting');
const ActionItem = require('../models/ActionItem');
const { analyseNotes } = require('../services/geminiService');
const { getCached, setCache } = require('../services/redisService');

/** Displays dashboard data for the signed-in user. */
exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const [pendingItems, meetings, overdueCount] = await Promise.all([
      ActionItem.find({ userId, status: 'pending' }).sort({ deadline: 1 }).limit(10),
      Meeting.find({ userId }).sort({ date: -1 }).limit(5),
      ActionItem.countDocuments({ userId, status: 'overdue' })
    ]);
    res.render('dashboard/index', { title: 'Dashboard', pendingItems, meetings, overdueCount });
  } catch (error) { req.flash('error', error.message); res.redirect('/login'); }
};
/** Lists all meetings. */
exports.index = async (req, res) => {
  try {
    const meetings = await Meeting.aggregate([{ $match: { userId: req.session.userId } }, { $sort: { date: -1 } }, { $lookup: { from: 'actionitems', localField: '_id', foreignField: 'meetingId', as: 'actionItems' } }]);
    res.render('meetings/index', { title: 'Meetings', meetings });
  } catch (error) { req.flash('error', error.message); res.redirect('/dashboard'); }
};
/** Renders the new meeting form. */
exports.newMeeting = (req, res) => res.render('meetings/new', { title: 'New Meeting' });
/** Analyses notes, preferring a cached result. */
exports.analyse = async (req, res) => {
  try {
    const rawNotes = String(req.body.rawNotes || '').trim();
    if (!rawNotes) return res.status(400).json({ success: false, message: 'Meeting notes are required.' });
    let result = await getCached(rawNotes);
    if (!result) { result = await analyseNotes(rawNotes); await setCache(rawNotes, result); }
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, message: 'Unable to analyse meeting notes.' }); }
};
/** Saves a meeting and its AI-extracted action items. */
exports.create = async (req, res) => {
  try {
    const { title, date, rawNotes } = req.body;
    if (!title || !date || !rawNotes) throw new Error('Title, date, and notes are required.');
    let analysis = JSON.parse(req.body.analysis || '{}');
    const meeting = await Meeting.create({ userId: req.session.userId, title, date, rawNotes, decisions: analysis.decisions || [], unresolved: analysis.unresolved || [], nextMeeting: analysis.nextMeeting || null });
    const actionItems = Array.isArray(analysis.actionItems) ? analysis.actionItems : [];
    if (actionItems.length) await ActionItem.insertMany(actionItems.filter((item) => item.task).map((item) => ({ meetingId: meeting._id, userId: req.session.userId, task: item.task, owner: item.owner || 'Unassigned', ownerEmail: item.ownerEmail || '', deadline: item.deadline || null })));
    req.flash('success', 'Meeting saved successfully.'); res.redirect(`/meetings/${meeting._id}`);
  } catch (error) { req.flash('error', `Could not save meeting: ${error.message}`); res.redirect('/meetings/new'); }
};
/** Displays a single meeting and its action items. */
exports.show = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!meeting) throw new Error('Meeting not found.');
    const actionItems = await ActionItem.find({ meetingId: meeting._id }).sort({ deadline: 1 });
    res.render('meetings/show', { title: meeting.title, meeting, actionItems });
  } catch (error) { req.flash('error', error.message); res.redirect('/meetings'); }
};
/** Deletes a meeting owned by the current user and its action items. */
exports.destroy = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    if (!meeting) throw new Error('Meeting not found.');
    await ActionItem.deleteMany({ meetingId: meeting._id });
    req.flash('success', 'Meeting deleted.'); res.redirect('/meetings');
  } catch (error) { req.flash('error', error.message); res.redirect('/meetings'); }
};

const bcrypt = require('bcrypt');
const User = require('../models/User');

/** Renders registration page. */
exports.showRegister = (req, res) => res.render('auth/register', { title: 'Register' });
/** Creates a user and begins a session. */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new Error('All fields are required.');
    if (await User.exists({ email: email.toLowerCase() })) throw new Error('An account with that email already exists.');
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    req.session.userId = user._id; req.session.userName = user.name;
    req.flash('success', 'Welcome to MeetingMind!'); res.redirect('/dashboard');
  } catch (error) { req.flash('error', error.message); res.redirect('/register'); }
};
/** Renders login page. */
exports.showLogin = (req, res) => res.render('auth/login', { title: 'Login' });
/** Verifies credentials and begins a session. */
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: String(req.body.email).toLowerCase() });
    if (!user || !await bcrypt.compare(req.body.password || '', user.password)) throw new Error('Invalid email or password.');
    req.session.userId = user._id; req.session.userName = user.name;
    req.flash('success', `Welcome back, ${user.name}!`); res.redirect('/dashboard');
  } catch (error) { req.flash('error', error.message); res.redirect('/login'); }
};
/** Destroys the current user session. */
exports.logout = (req, res) => req.session.destroy(() => res.redirect('/login'));

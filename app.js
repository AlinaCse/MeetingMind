require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const { connectRedis, closeRedis } = require('./services/redisService');
const { startCron } = require('./services/cronService');

const app = express();
app.set('view engine', 'ejs'); app.set('views', `${__dirname}/views`);
app.use(express.static(`${__dirname}/public`)); app.use(express.urlencoded({ extended: true })); app.use(express.json()); app.use(methodOverride('_method'));
app.use(session({ secret: process.env.SESSION_SECRET || 'development-secret', resave: false, saveUninitialized: false, store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }) }));
app.use(flash());
app.use((req, res, next) => { res.locals.sessionUser = req.session.userName; res.locals.successMessages = req.flash('success'); res.locals.errorMessages = req.flash('error'); next(); });
app.get('/', (req, res) => res.redirect(req.session.userId ? '/dashboard' : '/login'));
app.use(require('./routes/auth')); app.use(require('./routes/meetings')); app.use(require('./routes/actionItems'));
app.use((req, res) => res.status(404).render('auth/login', { title: 'Not Found' }));

/** Starts external connections and the HTTP server. */
async function start() {
  await connectDB();
  await connectRedis();
  startCron();
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => console.log(`MeetingMind running on port ${port}`));
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') console.error(`Port ${port} is already in use. Stop the other server or change PORT in .env.`);
    else console.error('HTTP server error:', error.message);
    process.exit(1);
  });
}
process.on('SIGINT', async () => { await closeRedis(); process.exit(0); }); process.on('SIGTERM', async () => { await closeRedis(); process.exit(0); });
start().catch((error) => { console.error('Unable to start application:', error.message); process.exit(1); });

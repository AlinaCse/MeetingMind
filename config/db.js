const mongoose = require('mongoose');

/** Connects the application to MongoDB. */
async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
}

module.exports = connectDB;

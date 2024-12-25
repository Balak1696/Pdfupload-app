const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  s3Key: String, 
  metadata: Object, 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

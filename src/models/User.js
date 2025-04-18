const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  refreshToken: {
    type: String,
    select: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', userSchema);
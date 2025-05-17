const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const userSchema = new Schema({
  login: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true,
    minlength: 3
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
    enum: ['user', 'admin', 'teacher']
  },
  refreshTokens: [{
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
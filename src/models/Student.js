const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return /^[\u0400-\u04FFa-zA-Z\s-]+$/u.test(v);
      },
      message: 'Имя может содержать только буквы и дефисы'
    }
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return /^[\u0400-\u04FFa-zA-Z\s-]+$/u.test(v);
      },
      message: 'Фамилия может содержать только буквы и дефисы'
    }
  },
  middleName: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        return v === '' || /^[\u0400-\u04FFa-zA-Z\s-]+$/u.test(v);
      },
      message: 'Отчество может содержать только буквы и дефисы'
    }
  },
  birthDate: {
    type: Date,
    default: null
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  admissionYear: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear(),
    default: new Date().getFullYear()
  },
  avatar: {
    type: String,
    default: null
  },
  password: {
    type: String,
    select: false,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

StudentSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Student', StudentSchema);
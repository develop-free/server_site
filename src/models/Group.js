const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department_id: { // Измененное название поля
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Group', GroupSchema);
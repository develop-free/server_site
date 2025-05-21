const mongoose = require('mongoose');

const AwardDegreeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название степени награды обязательно'],
    enum: ['1 место', '2 место', '3 место', 'участник', '1 степень', '2 степень', '3 степень', 'победитель'],
    unique: true,
  },
});

module.exports = mongoose.model('AwardDegree', AwardDegreeSchema);
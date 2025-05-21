const mongoose = require('mongoose');

const AwardTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название типа награды обязательно'],
    enum: ['грамота', 'сертификат', 'диплом', 'благодарственное письмо'],
    unique: true,
  },
});

module.exports = mongoose.model('AwardType', AwardTypeSchema);
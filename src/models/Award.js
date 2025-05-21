const mongoose = require('mongoose');

const AwardSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Идентификатор студента обязателен'],
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Идентификатор отделения обязателен'],
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Идентификатор группы обязателен'],
  },
  eventName: {
    type: String,
    required: [true, 'Название мероприятия обязательно'],
    trim: true,
  },
  awardType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwardType',
    required: [true, 'Тип награды обязателен'],
  },
  awardDegree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwardDegree',
    required: [true, 'Степень награды обязательна'],
  },
  filePath: {
    type: String,
    required: [true, 'Путь к файлу обязателен'],
  },
});

module.exports = mongoose.model('Award', AwardSchema);
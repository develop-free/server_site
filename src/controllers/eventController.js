const Event = require('../models/Event');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Level = require('../models/Level');
const mongoose = require('mongoose');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('students', 'first_name last_name')
      .populate('teacher', 'first_name last_name')
      .populate('level', 'levelName');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEvent = async (req, res) => {
  const { iconType, title, dateTime, students = [], teacher, level } = req.body;

  if (!iconType || !title || !dateTime) {
    return res.status(400).json({ message: 'Обязательные поля: iconType, title, dateTime' });
  }

  try {
    // Проверка существования студентов
    if (students.length > 0) {
      const existingStudents = await Student.countDocuments({ _id: { $in: students } });
      if (existingStudents !== students.length) {
        return res.status(400).json({ message: 'Один или несколько студентов не найдены' });
      }
    }

    // Проверка преподавателя
    if (teacher) {
      const teacherExists = await Teacher.exists({ _id: teacher });
      if (!teacherExists) {
        return res.status(400).json({ message: 'Преподаватель не найден' });
      }
    }

    // Проверка уровня
    if (level) {
      const levelExists = await Level.exists({ _id: level });
      if (!levelExists) {
        return res.status(400).json({ message: 'Уровень не найден' });
      }
    }

    const event = new Event({
      iconType,
      title,
      dateTime: new Date(dateTime),
      students,
      teacher,
      level
    });

    const savedEvent = await event.save();
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('students', 'first_name last_name')
      .populate('teacher', 'first_name last_name')
      .populate('level', 'levelName');

    res.status(201).json(populatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { iconType, title, dateTime, students = [], teacher, level } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Неверный ID мероприятия' });
  }

  if (!iconType || !title || !dateTime) {
    return res.status(400).json({ message: 'Обязательные поля: iconType, title, dateTime' });
  }

  try {
    // Проверка существования мероприятия
    const eventExists = await Event.exists({ _id: id });
    if (!eventExists) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    // Проверка существования студентов
    if (students.length > 0) {
      const existingStudents = await Student.countDocuments({ _id: { $in: students } });
      if (existingStudents !== students.length) {
        return res.status(400).json({ message: 'Один или несколько студентов не найдены' });
      }
    }

    // Проверка преподавателя
    if (teacher) {
      const teacherExists = await Teacher.exists({ _id: teacher });
      if (!teacherExists) {
        return res.status(400).json({ message: 'Преподаватель не найден' });
      }
    }

    // Проверка уровня
    if (level) {
      const levelExists = await Level.exists({ _id: level });
      if (!levelExists) {
        return res.status(400).json({ message: 'Уровень не найден' });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        iconType,
        title,
        dateTime: new Date(dateTime),
        students,
        teacher,
        level
      },
      { new: true }
    )
    .populate('students', 'first_name last_name')
    .populate('teacher', 'first_name last_name')
    .populate('level', 'levelName');

    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Неверный ID мероприятия' });
  }

  try {
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }
    res.json({ message: 'Мероприятие удалено' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
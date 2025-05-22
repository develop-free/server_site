const Award = require('../models/Award');
const AwardType = require('../models/AwardType');
const AwardDegree = require('../models/AwardDegree');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Group = require('../models/Group');
const Level = require('../models/Level');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Поддерживаются только файлы JPEG, PNG или PDF'));
  },
}).single('filePath');

exports.getAwards = async (req, res) => {
  try {
    const awards = await Award.find()
      .populate('studentId', 'first_name last_name middle_name')
      .populate('departmentId', 'name')
      .populate('groupId', 'name')
      .populate('awardType', 'name')
      .populate('awardDegree', 'name')
      .populate('level', 'levelName');
    res.status(200).json(awards);
  } catch (error) {
    console.error('Ошибка при получении наград:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.createAward = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Ошибка загрузки файла:', err);
      return res.status(400).json({ message: err.message });
    }

    const { studentId, departmentId, groupId, eventName, awardType, awardDegree, teacherId, level } = req.body;
    const filePath = req.file ? req.file.path : null;

    try {
      // Проверка наличия всех обязательных полей
      if (!studentId) {
        return res.status(400).json({ message: 'Поле studentId обязательно' });
      }
      if (!departmentId) {
        return res.status(400).json({ message: 'Поле departmentId обязательно' });
      }
      if (!groupId) {
        return res.status(400).json({ message: 'Поле groupId обязательно' });
      }
      if (!eventName) {
        return res.status(400).json({ message: 'Поле eventName обязательно' });
      }
      if (!awardType) {
        return res.status(400).json({ message: 'Поле awardType обязательно' });
      }
      if (!level) {
        return res.status(400).json({ message: 'Поле level обязательно' });
      }
      if (!teacherId) {
        return res.status(400).json({ message: 'Поле teacherId обязательно' });
      }

      // Проверка валидности ObjectId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: `Недействительный ID студента: ${studentId}` });
      }
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ message: `Недействительный ID отделения: ${departmentId}` });
      }
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: `Недействительный ID группы: ${groupId}` });
      }
      if (!mongoose.Types.ObjectId.isValid(awardType)) {
        return res.status(400).json({ message: `Недействительный ID типа награды: ${awardType}` });
      }
      if (awardDegree && !mongoose.Types.ObjectId.isValid(awardDegree)) {
        return res.status(400).json({ message: `Недействительный ID степени награды: ${awardDegree}` });
      }
      if (!mongoose.Types.ObjectId.isValid(level)) {
        return res.status(400).json({ message: `Недействительный ID уровня: ${level}` });
      }
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: `Недействительный ID преподавателя: ${teacherId}` });
      }

      // Проверка существования связанных записей
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: `Студент с ID ${studentId} не найден` });
      }
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: `Отделение с ID ${departmentId} не найдено` });
      }
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: `Группа с ID ${groupId} не найдена` });
      }
      const awardTypeDoc = await AwardType.findById(awardType);
      if (!awardTypeDoc) {
        return res.status(404).json({ message: `Тип награды с ID ${awardType} не найден` });
      }
      const levelDoc = await Level.findById(level);
      if (!levelDoc) {
        return res.status(404).json({ message: `Уровень с ID ${level} не найден` });
      }

      // Проверка awardDegree, если указан
      if (awardTypeDoc.name.toLowerCase() !== 'благодарственное письмо' && awardDegree) {
        const awardDegreeDoc = await AwardDegree.findOne({ _id: awardDegree, awarddegrees_id: awardType });
        if (!awardDegreeDoc) {
          return res.status(400).json({ message: 'Степень награды не соответствует выбранному типу награды' });
        }
      }

      const award = new Award({
        studentId,
        departmentId,
        groupId,
        eventName,
        awardType,
        awardDegree: awardDegree || null,
        level,
        filePath,
        teacherId,
      });

      await award.save();
      res.status(201).json({ message: 'Награда успешно создана', award });
    } catch (error) {
      console.error('Ошибка при создании награды:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  });
};

exports.getAwardTypes = async (req, res) => {
  try {
    const awardTypes = await AwardType.find();
    res.status(200).json(awardTypes);
  } catch (error) {
    console.error('Ошибка при получении типов наград:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getAwardDegrees = async (req, res) => {
  try {
    const awardDegrees = await AwardDegree.find();
    res.status(200).json(awardDegrees);
  } catch (error) {
    console.error('Ошибка при получении степеней наград:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ message: 'Недействительный ID отделения' });
    }

    const groups = await Group.find({ department_id: departmentId });
    res.status(200).json(groups);
  } catch (error) {
    console.error('Ошибка при получении групп:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error('Ошибка при получении студентов:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json(departments);
  } catch (error) {
    console.error('Ошибка при получении отделений:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find();
    res.status(200).json(levels);
  } catch (error) {
    console.error('Ошибка при получении уровней:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};
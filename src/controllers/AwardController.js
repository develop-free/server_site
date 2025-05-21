const Award = require('../models/Award');
const AwardType = require('../models/AwardType');
const AwardDegree = require('../models/AwardDegree');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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

// Получение всех наград
exports.getAwards = async (req, res) => {
  try {
    const awards = await Award.find()
      .populate('studentId', 'first_name last_name middle_name')
      .populate('departmentId', 'name')
      .populate('groupId', 'name')
      .populate('awardType', 'name')
      .populate('awardDegree', 'name');
    res.status(200).json(awards);
  } catch (error) {
    console.error('Ошибка при получении наград:', error);
    res.status(500).json({ message: 'Ошибка при получении наград', error: error.message });
  }
};

// Создание новой награды
exports.createAward = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Ошибка загрузки файла:', err);
      return res.status(400).json({ message: err.message });
    }

    const { studentId, departmentId, groupId, eventName, awardType, awardDegree, teacherId } = req.body;
    const filePath = req.file ? req.file.path : null;

    try {
      // Валидация полей
      if (!studentId || !departmentId || !groupId || !eventName || !awardType || !awardDegree || !filePath) {
        return res.status(400).json({ message: 'Все поля обязательны' });
      }

      // Проверка существования записей
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: 'Недействительный ID студента' });
      }
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ message: 'Недействительный ID отделения' });
      }
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: 'Недействительный ID группы' });
      }
      if (!mongoose.Types.ObjectId.isValid(awardType)) {
        return res.status(400).json({ message: 'Недействительный ID типа награды' });
      }
      if (!mongoose.Types.ObjectId.isValid(awardDegree)) {
        return res.status(400).json({ message: 'Недействительный ID степени награды' });
      }

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Студент не найден' });

      const department = await Department.findById(departmentId);
      if (!department) return res.status(404).json({ message: 'Отделение не найдено' });

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Группа не найдена' });

      const awardTypeDoc = await AwardType.findById(awardType);
      if (!awardTypeDoc) return res.status(404).json({ message: 'Тип награды не найден' });

      const awardDegreeDoc = await AwardDegree.findById(awardDegree);
      if (!awardDegreeDoc) return res.status(404).json({ message: 'Степень награды не найдена' });

      // Проверка соответствия типа и степени награды
      const validDegrees = {
        'грамота': ['1 место', '2 место', '3 место', 'участник'],
        'сертификат': ['участник', 'победитель'],
        'диплом': ['1 степень', '2 степень', '3 степень', 'победитель'],
        'благодарственное письмо': ['участник'],
      };

      if (!validDegrees[awardTypeDoc.name.toLowerCase()]?.includes(awardDegreeDoc.name)) {
        return res.status(400).json({ message: 'Недопустимая степень для выбранного типа награды' });
      }

      const award = new Award({
        studentId,
        departmentId,
        groupId,
        eventName,
        awardType,
        awardDegree,
        filePath,
        teacherId,
      });

      await award.save();
      res.status(201).json({ message: 'Награда успешно создана', award });
    } catch (error) {
      console.error('Ошибка при создании награды:', error);
      res.status(500).json({ message: 'Ошибка при создании награды', error: error.message });
    }
  });
};

// Получение всех типов наград
exports.getAwardTypes = async (req, res) => {
  try {
    const awardTypes = await AwardType.find();
    res.status(200).json(awardTypes);
  } catch (error) {
    console.error('Ошибка при получении типов наград:', error);
    res.status(500).json({ message: 'Ошибка при получении типов наград', error: error.message });
  }
};

// Получение всех степеней наград
exports.getAwardDegrees = async (req, res) => {
  try {
    const awardDegrees = await AwardDegree.find();
    res.status(200).json(awardDegrees);
  } catch (error) {
    console.error('Ошибка при получении степеней наград:', error);
    res.status(500).json({ message: 'Ошибка при получении степеней наград', error: error.message });
  }
};

// Получение групп по departmentId
exports.getGroups = async (req, res) => {
  try {
    const { departmentId } = req.query;

    console.log('Получен departmentId:', departmentId); // Отладочный лог

    if (!departmentId) {
      return res.status(400).json({ message: 'Идентификатор отделения обязателен' });
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ message: 'Недействительный ID отделения' });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Отделение не найдено' });
    }

    const groups = await Group.find({ departmentId });
    res.status(200).json(groups);
  } catch (error) {
    console.error('Ошибка при получении групп:', error);
    res.status(500).json({ message: 'Ошибка при получении групп', error: error.message });
  }
};
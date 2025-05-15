const Student = require('../models/Student');
const User = require('../models/User');
const Department = require('../models/Department');
const Group = require('../models/Group');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const unlinkAsync = promisify(fs.unlink);

const getProfile = async (req, res) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован или неверный идентификатор',
      });
    }

    let student = await Student.findOne({ user: req.user.id })
      .populate('department_id', 'name _id')
      .populate('group_id', 'name _id');

    const user = await User.findById(req.user.id).select('email login');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    if (!student) {
      const response = {
        success: true,
        isNewUser: true,
        data: {
          first_name: '',
          last_name: '',
          middle_name: '',
          birth_date: '',
          department_id: null,
          group_id: null,
          login: user.login || '',
          email: user.email || '',
          avatar: null,
          admission_year: new Date().getFullYear(),
        },
      };
      return res.json(response);
    }

    const response = {
      success: true,
      isNewUser: false,
      data: {
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        middle_name: student.middle_name || '',
        birth_date: student.birth_date?.toISOString().split('T')[0] || '',
        department_id: student.department_id,
        group_id: student.group_id,
        login: student.login || user.login || '',
        email: student.email || user.email || '',
        admission_year: student.admission_year || new Date().getFullYear(),
        avatar: student.avatar || null,
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
    });
  }
};

const createProfile = async (req, res) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован или неверный идентификатор',
      });
    }

    const {
      first_name,
      last_name,
      middle_name,
      birth_date,
      department_id,
      group_id,
      login,
      email,
      admission_year,
    } = req.body;

    if (!mongoose.isValidObjectId(department_id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат идентификатора отделения',
      });
    }
    if (!mongoose.isValidObjectId(group_id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат идентификатора группы',
      });
    }

    const deptExists = await Department.exists({ _id: department_id });
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: 'Указанное отделение не существует',
      });
    }

    const groupExists = await Group.exists({ _id: group_id });
    if (!groupExists) {
      return res.status(400).json({
        success: false,
        message: 'Указанная группа не существует',
      });
    }

    const existingStudent = await Student.findOne({ user: req.user.id });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Профиль для этого пользователя уже существует',
      });
    }

    const loginExists = await User.findOne({ login, _id: { $ne: req.user.id } });
    if (loginExists) {
      return res.status(400).json({
        success: false,
        message: 'Этот логин уже занят',
      });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Этот email уже используется',
      });
    }

    const studentData = {
      user: req.user.id,
      first_name,
      last_name,
      middle_name: middle_name || '',
      birth_date: new Date(birth_date),
      department_id,
      group_id,
      login,
      email,
      admission_year: parseInt(admission_year, 10),
    };

    let student = new Student(studentData);

    if (req.file) {
      student.avatar = `/uploads/${req.file.filename}`;
    }

    await student.save();

    await User.findByIdAndUpdate(req.user.id, {
      login,
      email,
    });

    const populatedStudent = await Student.findById(student._id)
      .populate('department_id group_id');

    res.json({
      success: true,
      message: 'Профиль успешно создан',
      data: {
        first_name: populatedStudent.first_name,
        last_name: populatedStudent.last_name,
        middle_name: populatedStudent.middle_name,
        birth_date: populatedStudent.birth_date?.toISOString().split('T')[0] || '',
        department_id: populatedStudent.department_id,
        group_id: populatedStudent.group_id,
        login: populatedStudent.login,
        email: populatedStudent.email,
        admission_year: populatedStudent.admission_year,
        avatar: populatedStudent.avatar,
      },
    });
  } catch (error) {
    console.error('Ошибка при создании профиля:', error);

    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../Uploads/', req.file.filename);
        if (fs.existsSync(filePath)) {
          await unlinkAsync(filePath);
        }
      } catch (err) {
        console.error('Ошибка при удалении загруженного файла:', err);
      }
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Ошибка: значение для поля ${field} должно быть уникальным`,
        errors: [error.errmsg],
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании профиля',
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован или неверный идентификатор',
      });
    }

    const {
      first_name,
      last_name,
      middle_name,
      birth_date,
      department_id,
      group_id,
      login,
      email,
      admission_year,
      oldPassword,
      newPassword,
    } = req.body;

    if (!mongoose.isValidObjectId(department_id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат идентификатора отделения',
      });
    }
    if (!mongoose.isValidObjectId(group_id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат идентификатора группы',
      });
    }

    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Профиль студента не найден. Используйте POST для создания нового профиля.',
      });
    }

    const deptExists = await Department.exists({ _id: department_id });
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: 'Указанное отделение не существует',
      });
    }

    const groupExists = await Group.exists({ _id: group_id });
    if (!groupExists) {
      return res.status(400).json({
        success: false,
        message: 'Указанная группа не существует',
      });
    }

    const loginExists = await User.findOne({ login, _id: { $ne: req.user.id } });
    if (loginExists) {
      return res.status(400).json({
        success: false,
        message: 'Этот логин уже занят',
      });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Этот email уже используется',
      });
    }

    const studentData = {
      first_name,
      last_name,
      middle_name: middle_name || '',
      birth_date: new Date(birth_date),
      department_id,
      group_id,
      login,
      email,
      admission_year: parseInt(admission_year, 10),
    };

    Object.assign(student, studentData);

    if (oldPassword && newPassword) {
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Неверный старый пароль',
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
    }

    await User.findByIdAndUpdate(req.user.id, {
      login,
      email,
    });

    if (req.file) {
      if (student.avatar) {
        try {
          const oldPath = path.join(__dirname, '../../', student.avatar);
          if (fs.existsSync(oldPath)) {
            await unlinkAsync(oldPath);
          }
        } catch (err) {
          console.error('Ошибка при удалении старого аватара:', err);
        }
      }
      student.avatar = `/uploads/${req.file.filename}`;
    }

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('department_id group_id');

    res.json({
      success: true,
      message: 'Профиль успешно обновлён',
      data: {
        first_name: populatedStudent.first_name,
        last_name: populatedStudent.last_name,
        middle_name: populatedStudent.middle_name,
        birth_date: populatedStudent.birth_date?.toISOString().split('T')[0] || '',
        department_id: populatedStudent.department_id,
        group_id: populatedStudent.group_id,
        login: populatedStudent.login,
        email: populatedStudent.email,
        admission_year: populatedStudent.admission_year,
        avatar: populatedStudent.avatar,
      },
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);

    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../Uploads/', req.file.filename);
        if (fs.existsSync(filePath)) {
          await unlinkAsync(filePath);
        }
      } catch (err) {
        console.error('Ошибка при удалении загруженного файла:', err);
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении профиля',
      error: error.message,
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не был загружен',
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Профиль студента не найден',
      });
    }

    if (student.avatar) {
      try {
        const oldPath = path.join(__dirname, '../../', student.avatar);
        if (fs.existsSync(oldPath)) {
          await unlinkAsync(oldPath);
        }
      } catch (err) {
        console.error('Ошибка удаления старого аватара:', err);
      }
    }

    student.avatar = `/uploads/${req.file.filename}`;
    await student.save();

    res.json({
      success: true,
      message: 'Аватар успешно обновлен',
      avatar: student.avatar,
    });
  } catch (error) {
    console.error('Ошибка обновления аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении аватара',
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка загрузки отделений',
      error: err.message,
    });
  }
};

const getGroupsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.query;
    if (!department_id || !mongoose.isValidObjectId(department_id)) {
      return res.status(400).json({ message: 'Не указано или неверное отделение' });
    }
    const groups = await Group.find({ department_id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка загрузки групп',
      error: err.message,
    });
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  updateAvatar,
  getDepartments,
  getGroupsByDepartment,
};
const Student = require('../models/Student');
const User = require('../models/User');
const Department = require('../models/Department');
const Group = require('../models/Group');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

const getProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user.id })
      .populate('department', 'name _id')
      .populate('group', 'name _id')
      .populate({
        path: 'user',
        select: 'email'
      });

    if (!student) {
      return res.json({
        success: true,
        isNewUser: true,
        data: {
          firstName: '',
          lastName: '',
          middleName: '',
          birthDate: '',
          department: null,
          group: null,
          email: req.user.email || '',
          avatar: null,
          admissionYear: new Date().getFullYear()
        }
      });
    }

    res.json({
      success: true,
      isNewUser: false,
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName,
        birthDate: student.birthDate?.toISOString().split('T')[0] || '',
        department: student.department,
        group: student.group,
        email: student.user?.email || student.email || req.user.email,
        admissionYear: student.admissionYear,
        avatar: student.avatar,
        user: { email: student.user?.email }
      }
    });
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, middleName, birthDate, department, group, email, admissionYear } = req.body;

    let student = await Student.findOne({ user: req.user.id });

    if (!student) {
      student = new Student({
        user: req.user.id,
        firstName,
        lastName,
        middleName,
        birthDate: birthDate || null,
        department: department || null,
        group: group || null,
        email: email || req.user.email,
        admissionYear: admissionYear || new Date().getFullYear()
      });
    } else {
      student.firstName = firstName;
      student.lastName = lastName;
      student.middleName = middleName;
      student.birthDate = birthDate || null;
      student.department = department || null;
      student.group = group || null;
      student.email = email || student.email;
      student.admissionYear = admissionYear || student.admissionYear;
    }

    if (email && email !== req.user.email) {
      await User.findByIdAndUpdate(req.user.id, { email });
    }

    if (department) {
      const deptExists = await Department.exists({ _id: department });
      if (!deptExists) {
        return res.status(400).json({
          success: false,
          message: 'Указанное отделение не существует'
        });
      }
    }

    if (group) {
      const groupExists = await Group.exists({ _id: group });
      if (!groupExists) {
        return res.status(400).json({
          success: false,
          message: 'Указанная группа не существует'
        });
      }
    }

    if (req.file) {
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
    }

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('department group')
      .populate({
        path: 'user',
        select: 'email'
      });

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: {
        firstName: populatedStudent.firstName,
        lastName: populatedStudent.lastName,
        middleName: populatedStudent.middleName,
        birthDate: populatedStudent.birthDate?.toISOString().split('T')[0],
        department: populatedStudent.department,
        group: populatedStudent.group,
        email: populatedStudent.user?.email || populatedStudent.email,
        admissionYear: populatedStudent.admissionYear,
        avatar: populatedStudent.avatar
      }
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);

    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../uploads/', req.file.filename);
        if (fs.existsSync(filePath)) {
          await unlinkAsync(filePath);
        }
      } catch (err) {
        console.error('Ошибка удаления загруженного файла:', err);
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении профиля'
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не был загружен'
      });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Профиль студента не найден'
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
      avatar: student.avatar
    });
  } catch (error) {
    console.error('Ошибка обновления аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении аватара'
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
      error: err.message
    });
  }
};

const getGroupsByDepartment = async (req, res) => {
  try {
    const { department_id } = req.query;
    if (!department_id) {
      return res.status(400).json({ message: 'Не указано отделение' });
    }
    const groups = await Group.find({ department_id });
    res.json(groups);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка загрузки групп',
      error: err.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDepartments,
  getGroupsByDepartment
};  
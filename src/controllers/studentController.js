const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const Department = require('../models/Department');
const Group = require('../models/Group');
const Student = require('../models/Student');

// Получение профиля студента
const getProfile = async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user.id })
      .populate('department', 'name _id')
      .populate('group', 'name _id');

    if (!student) {
      // Возвращаем пустой профиль без сохранения в БД
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
          avatar: null
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
        email: student.email,
        avatar: student.avatar
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



// Обновление профиля студента
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, middleName, birthDate, department, group, email } = req.body;

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

    const updateData = {
      firstName,
      lastName,
      middleName,
      birthDate: birthDate || null,
      department: department || null,
      group: group || null,
      email,
      updatedAt: new Date()
    };

    if (req.file) {
      const oldStudent = await Student.findOne({ user: req.user.id });

      if (oldStudent?.avatar) {
        try {
          const oldPath = path.join(__dirname, '../../', oldStudent.avatar);
          if (fs.existsSync(oldPath)) {
            await unlinkAsync(oldPath);
          }
        } catch (err) {
          console.error('Ошибка удаления старого аватара:', err);
        }
      }

      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('department group');

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: {
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        middleName: updatedStudent.middleName,
        birthDate: updatedStudent.birthDate?.toISOString().split('T')[0],
        department: updatedStudent.department,
        group: updatedStudent.group,
        email: updatedStudent.email,
        avatar: updatedStudent.avatar
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

// Обновление аватара
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл аватара не был загружен'
      });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      await unlinkAsync(path.join(__dirname, '../../uploads/', req.file.filename));
      return res.status(404).json({
        success: false,
        message: 'Студент не найден'
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

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении аватара'
    });
  }
};

// Получение списка отделений
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().select('name _id');
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Ошибка получения отделений:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении отделений'
    });
  }
};

const getGroupsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Проверка на валидный ObjectId
    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат ID отделения'
      });
    }

    const groups = await Group.find({ department: departmentId });
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Студент не найден'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Текущий пароль неверен' });
    }
    student.password = await bcrypt.hash(newPassword, 10);
    await student.save();

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('Ошибка при изменении пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при изменении пароля'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDepartments,
  getGroupsByDepartment,
  changePassword
};
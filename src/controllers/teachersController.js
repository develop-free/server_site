const mongoose = require('mongoose');
const Teacher = mongoose.model('Teacher');
const User = mongoose.model('User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Настройка Nodemailer с использованием пароля приложения
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // например, 'CyberCats.kpk@gmail.com'
    pass: process.env.EMAIL_APP_PASS, // Используйте пароль приложения Gmail, а не обычный пароль
  },
});

// Генерация случайного логина
const generateLogin = () => {
  const randomString = crypto.randomBytes(3).toString('hex');
  return `teacher_${randomString}`;
};

// Генерация случайного пароля
const generatePassword = () => {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
};

// Отправка учетных данных на email
const sendTeacherCredentials = async (email, login, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Ваши учетные данные для входа',
    text: `Ваш логин: ${login}\nВаш пароль: ${password}\nПожалуйста, измените пароль после первого входа.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    throw new Error('Не удалось отправить учетные данные на email: ' + error.message);
  }
};

// Получение всех преподавателей
const fetchTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('user', 'email role');
    const formattedTeachers = teachers.map(teacher => ({
      _id: teacher._id,
      last_name: teacher.last_name,
      first_name: teacher.first_name,
      middle_name: teacher.middle_name,
      position: teacher.position,
      email: teacher.user.email,
      is_teacher: teacher.user.role === 'teacher',
    }));
    res.json(formattedTeachers);
  } catch (error) {
    console.error('Ошибка получения преподавателей:', error);
    res.status(500).json({ error: 'Ошибка получения преподавателей: ' + error.message });
  }
};

// Создание преподавателя
const createTeacher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { last_name, first_name, middle_name, position, email, is_teacher } = req.body;

    // Валидация
    if (!last_name || !first_name || !position || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Генерация логина и пароля
    const login = generateLogin();
    const password = generatePassword();

    // Создание пользователя
    const user = new User({
      login,
      email,
      password: await bcrypt.hash(password, 10),
      role: is_teacher ? 'teacher' : 'user',
    });
    await user.save({ session });

    // Создание преподавателя
    const teacher = new Teacher({
      user: user._id,
      last_name,
      first_name,
      middle_name,
      position,
    });
    await teacher.save({ session });

    // Отправка учетных данных
    await sendTeacherCredentials(email, login, password);

    await session.commitTransaction();
    res.status(201).json({
      _id: teacher._id,
      last_name,
      first_name,
      middle_name,
      position,
      email,
      is_teacher,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Обновление преподавателя
const updateTeacher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { last_name, first_name, middle_name, position, email, is_teacher } = req.body;

    // Валидация
    if (!last_name || !first_name || !position || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка, существует ли другой пользователь с таким email
    const existingUser = await User.findOne({ email, _id: { $ne: id } }).session(session);
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Обновление преподавателя
    const teacher = await Teacher.findById(id).session(session);
    if (!teacher) {
      throw new Error('Преподаватель не найден');
    }

    teacher.last_name = last_name;
    teacher.first_name = first_name;
    teacher.middle_name = middle_name;
    teacher.position = position;
    await teacher.save({ session });

    // Обновление пользователя
    const user = await User.findById(teacher.user).session(session);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.email = email;
    user.role = is_teacher ? 'teacher' : 'user';
    await user.save({ session });

    await session.commitTransaction();
    res.json({
      _id: teacher._id,
      last_name,
      first_name,
      middle_name,
      position,
      email,
      is_teacher,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Удаление преподавателя
const deleteTeacher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).session(session);
    if (!teacher) {
      throw new Error('Преподаватель не найден');
    }

    // Удаление пользователя
    await User.findByIdAndDelete(teacher.user).session(session);
    // Удаление преподавателя
    await Teacher.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
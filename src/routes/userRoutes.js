const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens, verifyToken } = require('../utils/jwt');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config/config');

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Пользователь зарегистрирован' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    console.log('Получен запрос на авторизацию:', req.body);

    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const user = await User.findOne({ $or: [{ email: login }, { name: login }] });
    if (!user) {
      console.log('Пользователь не найден');
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Неверный пароль');
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    console.log('Авторизация успешна для пользователя:', user.email);
    res.status(200).json({ message: 'Авторизация успешна', accessToken, refreshToken });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Ошибка авторизации' });
  }
});

// Обновление токена
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh токен отсутствует' });
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    return res.status(403).json({ error: 'Неверный refresh токен' });
  }

  const decoded = verifyToken(refreshToken, config.jwt.refreshSecret);
  if (!decoded) {
    return res.status(403).json({ error: 'Неверный refresh токен' });
  }

  const { accessToken } = generateTokens(user);
  res.status(200).json({ accessToken });
});

// Выход из аккаунта
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при выходе из аккаунта' });
  }
});

module.exports = router;
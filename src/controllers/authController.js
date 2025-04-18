const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Генерация токенов
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role || 'user' },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiration || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration || '7d' }
  );

  return { accessToken, refreshToken };
};

// Контроллеры
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ 
        success: false,
        message: 'Email уже используется' 
      });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'user'
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(201).json({
      success: true,
      accessToken,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ 
      $or: [{ email: login }, { name: login }] 
    }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({
      success: true,
      accessToken,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка авторизации'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Выход выполнен'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка выхода'
    });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки авторизации'
    });
  }
};
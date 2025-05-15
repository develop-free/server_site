const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { generateTokens } = require('../utils/jwt');

// Контроллеры
exports.register = async (req, res) => {
  try {
    const { login, email, password } = req.body;

    if (await User.findOne({ $or: [{ email }, { login }] })) {
      return res.status(400).json({ 
        success: false,
        message: 'Email или логин уже используется' 
      });
    }

    const user = await User.create({
      login,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'user'
    });

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

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
      $or: [{ email: login }, { login }] 
    }).select('+password +refreshToken');

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

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Требуется refresh token'
      });
    }

    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh token'
      });
    }

    try {
      jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления токена'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
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
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.status(201).json({ accessToken, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const user = await User.findOne({ $or: [{ email: login }, { name: login }] });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.json({ accessToken, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken, config.jwt.refreshSecret);
    const user = await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Token refresh failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

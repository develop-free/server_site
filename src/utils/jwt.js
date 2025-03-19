const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiration,
  });
  const refreshToken = jwt.sign({ id: user._id, role: user.role }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration,
  });

  return { accessToken, refreshToken };
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTokens, verifyToken };
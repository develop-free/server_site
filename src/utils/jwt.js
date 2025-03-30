const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role };
  
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiration }
  );
  
  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiration }
  );

  return { accessToken, refreshToken };
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = { generateTokens, verifyToken };
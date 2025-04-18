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
    const decoded = jwt.verify(token, secret);
    
    // Добавляем проверку "почти истекшего" токена
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;
    
    if (expiresIn < 60 * 5) { // Если осталось меньше 5 минут
      decoded.isAboutToExpire = true;
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = { generateTokens, verifyToken };
const { verifyToken } = require('../utils/jwt');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  const decoded = verifyToken(token, config.jwt.secret);
  if (!decoded) {
    return res.status(403).json({ error: 'Неверный токен' });
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;
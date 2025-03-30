const { verifyToken } = require('../utils/jwt');
const config = require('../config/config');

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Неверный или истекший токен' });
  }
};

exports.roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
};

const express = require('express');
const { register, login, refreshToken, logout } = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);
router.get('/check-role', authMiddleware, (req, res) => {
  res.json({ role: req.user.role });
});

module.exports = router;

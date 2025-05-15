const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Маршруты аутентификации
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.get('/check', authMiddleware.authenticate, authController.checkAuth);

module.exports = router;
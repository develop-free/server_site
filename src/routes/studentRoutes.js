const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Маршруты для студента
router.get('/profile', authMiddleware.authenticate, studentController.getProfile);

router.put('/profile', authMiddleware.authenticate, upload.single('avatar'), studentController.updateProfile);

router.patch('/avatar', authMiddleware.authenticate, upload.single('avatar'), studentController.updateAvatar);

router.get('/departments', studentController.getDepartments); // Добавьте этот маршрут

router.get('/groups/:departmentId', studentController.getGroupsByDepartment); // Убедитесь, что этот маршрут существует

module.exports = router;

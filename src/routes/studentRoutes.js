const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Маршруты для профиля студента
router.get('/profile', authMiddleware.authenticate, studentController.getProfile);
router.put('/profile', authMiddleware.authenticate, upload.single('avatar'), studentController.updateProfile);
router.patch('/profile/avatar', authMiddleware.authenticate, upload.single('avatar'), studentController.updateAvatar);

// Маршруты для отделений и групп (изменяем путь)
router.get('/departments/all', authMiddleware.authenticate, studentController.getDepartments);
router.get('/groups/:departmentId', authMiddleware.authenticate, studentController.getGroupsByDepartment);

module.exports = router;
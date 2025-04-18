const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Маршруты для студента
router.get('/profile', 
  authMiddleware.authenticate, 
  studentController.getProfile
);

router.put('/profile',
  authMiddleware.authenticate,
  upload.single('avatar'), // Теперь upload точно является функцией
  studentController.updateProfile
);

router.patch('/avatar',
  authMiddleware.authenticate,
  upload.single('avatar'),
  studentController.updateAvatar
);

module.exports = router;
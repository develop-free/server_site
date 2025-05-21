const express = require('express');
const router = express.Router();
const AwardController = require('../controllers/AwardController');

// Получение всех наград
router.get('/', AwardController.getAwards);

// Создание новой награды
router.post('/', AwardController.createAward);

// Получение всех типов наград
router.get('/types', AwardController.getAwardTypes);

// Получение всех степеней наград
router.get('/degrees', AwardController.getAwardDegrees);

module.exports = router;
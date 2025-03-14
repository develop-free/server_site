const express = require('express');
const router = express.Router();
const path = require('path');

// Укажите путь к папке client
const clientPath = path.join(__dirname, '../../../client/src/Pages');

// Маршруты для каждой папки
router.use('/authorization-registration', express.static(path.join(clientPath, 'AuthorizationRegistration')));
router.use('/home', express.static(path.join(clientPath, 'Home')));
router.use('/personal-account', express.static(path.join(clientPath, 'PersonalAccount')));
router.use('/rating', express.static(path.join(clientPath, 'Rating')));
router.use('/student', express.static(path.join(clientPath, 'Student')));
router.use('/teacher', express.static(path.join(clientPath, 'Teacher')));

module.exports = router;

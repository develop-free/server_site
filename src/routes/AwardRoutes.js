const express = require('express');
const router = express.Router();
const AwardController = require('../controllers/AwardController');

router.get('/', AwardController.getAwards);
router.post('/', AwardController.createAward);
router.get('/types', AwardController.getAwardTypes);
router.get('/degrees', AwardController.getAwardDegrees);
router.get('/groups/:departmentId', AwardController.getGroups);
router.get('/students', AwardController.getStudents);
router.get('/departments', AwardController.getDepartments);
router.get('/levels', AwardController.getLevels);

module.exports = router;
const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
  levelName: String
});

module.exports = mongoose.model('Level', LevelSchema);
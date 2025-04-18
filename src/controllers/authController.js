// Пример полного authController.js
exports.register = async (req, res) => {
  try {
    // Логика регистрации
    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    // Логика входа
    res.json({ token: 'generated-token' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

exports.logout = async (req, res) => {
  try {
    // Логика выхода
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    // Проверка авторизации
    res.json({ user: req.user });
  } catch (error) {
    res.status(403).json({ error: 'Not authenticated' });
  }
};
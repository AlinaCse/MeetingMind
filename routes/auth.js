const router = require('express').Router(); const controller = require('../controllers/authController');
router.get('/register', controller.showRegister); router.post('/register', controller.register); router.get('/login', controller.showLogin); router.post('/login', controller.login); router.get('/logout', controller.logout);
module.exports = router;

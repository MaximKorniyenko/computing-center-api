const express = require('express');
const { authController } = require('../container');

const router = express.Router();

router.post('/login', authController.login);
router.get('/login', authController.getLoginPage);

router.get('/logout', authController.logout);

module.exports = router;
const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middlewares/authMiddleware');
const { reportController } = require('../container');

router.get('/', isAuthenticated, hasRole('DB_ADMIN'), reportController.getReportPage);

module.exports = router;
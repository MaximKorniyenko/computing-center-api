const express = require('express');
const router = express.Router();
const { logsController } = require('../container');
const { isAuthenticated, hasRole } = require('../middlewares/authMiddleware');

router.get('/', isAuthenticated, hasRole(['DB_ADMIN']), logsController.getLogsPage);
router.post('/clear', isAuthenticated, hasRole(['DB_ADMIN']), logsController.clearLogs);

module.exports = router;
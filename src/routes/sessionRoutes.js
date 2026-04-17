const express = require('express');
const { sessionController } = require('../container');
const { isAuthenticated, hasRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/start', isAuthenticated, sessionController.startSession);
router.post('/end', isAuthenticated, sessionController.endSession);
router.post('/session-end', isAuthenticated, hasRole('DB_ADMIN'), sessionController.adminStopSession);
router.get('/', isAuthenticated, hasRole('DB_ADMIN'), sessionController.getSessionsPage);

module.exports = router;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const redisClient = require('./config/redis');

const ComputerDetails = require('./models/ComputerDetails');
const AuditLog = require('./models/AuditLog');

const AuthService = require('./services/authService');
const ComputerService = require('./services/computerService');
const LoggerService = require('./services/loggerService');
const ReportService = require('./services/reportService');
const SessionService = require('./services/sessionService');
const UserService = require('./services/userService');

const AuthController = require('./controllers/authController');
const ComputerController = require('./controllers/computerController');
const LogsController = require('./controllers/logsController');
const ReportController = require('./controllers/reportController');
const SessionController = require('./controllers/sessionController');
const UserController = require('./controllers/userController');

const loggerService = new LoggerService(AuditLog);
const authService = new AuthService(prisma);
const computerService = new ComputerService(prisma, redisClient, ComputerDetails);
const reportService = new ReportService(prisma);
const sessionService = new SessionService(prisma, redisClient);
const userService = new UserService(prisma);

const authController = new AuthController(authService, loggerService);
const computerController = new ComputerController(computerService, loggerService);
const logsController = new LogsController(loggerService);
const reportController = new ReportController(reportService, loggerService);
const sessionController = new SessionController(sessionService, loggerService);
const userController = new UserController(userService, loggerService);

module.exports = {
  prisma,
  redisClient,
  authController,
  computerController,
  logsController,
  reportController,
  sessionController,
  userController
};

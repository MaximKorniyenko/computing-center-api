const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const redisClient = require('./config/redis');

const ComputerDetails = require('./models/ComputerDetails');
const AuditLog = require('./models/AuditLog');

const UserRepository = require('./repositories/UserRepository');
const ComputerRepository = require('./repositories/ComputerRepository');
const ComputerDetailsRepository = require('./repositories/ComputerDetailsRepository');
const SessionRepository = require('./repositories/SessionRepository');
const LogRepository = require('./repositories/LogRepository');

const AuthService = require('./services/authService');
const ComputerService = require('./services/computerService');
const LoggerService = require('./services/loggerService');
const ReportService = require('./services/reportService');
const SessionService = require('./services/sessionService');
const UserService = require('./services/userService');

// КОНТРОЛЕРИ
const AuthController = require('./controllers/authController');
const ComputerController = require('./controllers/computerController');
const LogsController = require('./controllers/logsController');
const ReportController = require('./controllers/reportController');
const SessionController = require('./controllers/sessionController');
const UserController = require('./controllers/userController');


const userRepo = new UserRepository(prisma);
const computerRepo = new ComputerRepository(prisma);
const detailsRepo = new ComputerDetailsRepository(ComputerDetails);
const sessionRepo = new SessionRepository(prisma);
const logRepo = new LogRepository(AuditLog);

const loggerService = new LoggerService(logRepo);
const reportService = new ReportService(sessionRepo);
const authService = new AuthService(userRepo);
const userService = new UserService(userRepo);

const sessionService = new SessionService(sessionRepo, computerRepo, prisma, redisClient);

const computerService = new ComputerService(computerRepo, detailsRepo, sessionService, redisClient);

const authController = new AuthController(authService, loggerService);
const computerController = new ComputerController(computerService, sessionService, loggerService);
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
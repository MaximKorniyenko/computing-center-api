const TimeFormatter = require('../utils/timeFormatter');

class ReportService {
    constructor(sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    async getDailyReport(dateString, page = 1, limit = 10) {
        const date = dateString ? new Date(dateString) : new Date();
        const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

        const sessions = await this.sessionRepository.findByDateRange(startOfDay, endOfDay);

        const userStats = this._aggregateUserStats(sessions);
        const reportData = Object.values(userStats).sort((a, b) => b.totalMs - a.totalMs);

        const totalUsers = reportData.length;
        const offset = (page - 1) * limit;
        const paginatedData = reportData.slice(offset, offset + limit).map(item => ({
            ...item,
            formattedTime: TimeFormatter.formatDuration(item.totalMs)
        }));

        return {
            date: startOfDay,
            totalSessionsCount: sessions.length,
            reportData: paginatedData,
            totalPages: Math.ceil(totalUsers / limit) || 1,
            currentPage: page,
            totalUsers
        };
    }

    _aggregateUserStats(sessions) {
        const stats = {};
        const now = new Date();

        sessions.forEach(session => {
            if (session.user.deletedAt) return;

            const userId = session.user.id;
            if (!stats[userId]) {
                stats[userId] = { user: session.user, totalMs: 0, sessionsCount: 0 };
            }

            const endTime = session.endTime ? new Date(session.endTime) : now;
            const duration = endTime - new Date(session.startTime);

            stats[userId].totalMs += duration;
            stats[userId].sessionsCount += 1;
        });

        return stats;
    }
}

module.exports = ReportService;
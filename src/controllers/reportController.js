class ReportController {
    constructor(reportService, loggerService) {
        this.reportService = reportService;
        this.loggerService = loggerService;
    }

    getReportPage = async (req, res) => {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const page = parseInt(req.query.page) || 1;

        try {
            await this.loggerService.logAction(req, 'REPORT_VIEW', { reportDate: date, page });

            const stats = await this.reportService.getDailyReport(date, page, 10);

            res.render('pages/reports', {
                stats,
                queryDate: date,
                user: req.session.user
            });
        } catch (e) {
            console.error(e);
            res.status(500).send("Помилка генерації звіту");
        }
    };
}

module.exports = ReportController;
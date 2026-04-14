class ReportController {
    constructor(reportService, loggerService) {
        this.reportService = reportService;
        this.loggerService = loggerService;
    }

    getReportPage = async (req, res) => {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const page = parseInt(req.query.page) || 1;

            await this.loggerService.logAction(req, 'REPORT_VIEW', {
                reportDate: date,
                page: page
            });
            
            const stats = await this.reportService.getDailyReport(date, page, 10);

            res.render('pages/reports', {
                stats,
                queryDate: date
            });
        } catch (e) {
            console.error(e);
            await this.loggerService.logAction(req, 'REPORT_GENERATION_ERROR', {
                date: req.query.date,
                error: e.message
            }, 'ERROR');
            res.status(500).send("Помилка генерації звіту");
        }
    };
}

module.exports = ReportController;
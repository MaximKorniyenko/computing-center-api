class TimeFormatter {
    static formatDuration(ms) {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} год ${minutes} хв`;
    }
}

module.exports = TimeFormatter;
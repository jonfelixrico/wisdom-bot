const moment = require('moment');

const startTime = moment();

function getStartTime() {
    return startTime.format("dddd, MMMM Do YYYY, h:mm:ss a");
}

function getUptimeHours() {
    return moment().diff(startTime, 'hours', true);
}

module.exports = { getStartTime, getUptimeHours };
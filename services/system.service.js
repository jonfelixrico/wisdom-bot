const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Manila');

const startTime = moment();

const getStartTime = () => startTime.format("dddd, MMMM Do YYYY, h:mm:ss a");

const getUptimeHours = () => moment().diff(startTime, 'hours', true);

module.exports = { getStartTime, getUptimeHours };
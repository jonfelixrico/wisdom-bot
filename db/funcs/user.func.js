const models = require('../models'),
    User = models.User;

async function findUser(discordId) {
    await User.findOne({ discordId });
}

async function muteUser(targetId, adminId, reason, expiration) {

}

async function unmuteUser(targetId, adminId) {

}
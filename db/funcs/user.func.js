const models = require('../models'),
    moment = require('moment'),
    User = models.User;

async function findUser(discordMessageId) {
    return await User.findOne({ where: { discordMessageId } });
}

// Expects the discordMessageId of an admin. If the id is associated with am
// admin, returns the record. Else, throws an error.
async function findAdmin(discordMessageId) {
    const user = await User.findOne({ where: { discordMessageId } });

    if (!user.adminLevel) {
        throw new Error(`User is not an administrator`);
    }

    return user;
}

async function muteUser(targetId, adminId, reason, hours) {
    const admin = await findAdmin(adminId);
    const user = await findUser(targetId);

    if (await user.getActiveMuteFlag()) {
        throw new Error(`User is already muted.`);
    }

    if (user.adminLevel && admin.adminLevel < user.adminLevel) {
        throw new Error(`Target user is an admin with an equal or higher level.`);
    }

    return await user.createMuteFlag({
        reason,
        expiration: moment().add(hours, 'hours').toDate(),
        issuerId: admin.issuerId
    });
}

async function unmuteUser(targetId, adminId) {
    const admin = await findAdmin(adminId);
    const user = await findUser(targetId);
    
    const muteFlag = await user.getActiveMuteFlag();

    if (!muteFlag) {
        throw new Error(`User is not muted.`);
    }

    const flagIssuer = await muteFlag.getIssuer();
    if (flagIssuer.adminLevel > admin.adminLevel) {
        throw new Error(`Issuing admin has a higher rank than you.`);
    }

    return await muteFlag.destroy();
}

async function setAdminRank(targetId, adminId, adminLevel) {
    
}

module.exports = { findAdmin, findUser };
const config = require('../sequelize.config'),
    Sequelize = require('sequelize');

const User = module.exports = config.define('author', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    discordId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    adminLevel: Sequelize.INTEGER,
    mutedUntil: Sequelize.DATE
});
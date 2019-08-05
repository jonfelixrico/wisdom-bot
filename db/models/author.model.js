const config = require('../sequelize.config'),
    Sequelize = require('sequelize');

const Author = module.exports = config.define('author', {
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
    admin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
});
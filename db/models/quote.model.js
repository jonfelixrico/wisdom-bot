const Sequelize = require('sequelize'),
    shortUuid = require('short-uuid');

module.exports = function(sequelize) {
    const Quote = sequelize.define('quote', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        discordMessageId: {
            type: Sequelize.STRING,
            unique: true
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        author: {
            type: Sequelize.STRING,
            allowNull: false
        },
        year: Sequelize.INTEGER,
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    });

    return Quote;
}
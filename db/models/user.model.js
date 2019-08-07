const Sequelize = require('sequelize');

module.exports = function(sequelize) {
    return sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        discordUserId: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        adminLevel: Sequelize.INTEGER
    });
};
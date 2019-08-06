const Sequelize = require('sequelize');

module.exports = function(sequelize) {
    return sequelize.define('muteFlag', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        expiration: Sequelize.DATE,
        reason: Sequelize.TEXT
    });
}
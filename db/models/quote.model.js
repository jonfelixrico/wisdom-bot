const config = require('../sequelize.config'),
    Sequelize = require('sequelize'),
    shortUuid = require('short-uuid');

const Quote = module.exports = config.define('quote', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uuid: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    content: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
});

Quote.addHook('afterValidate', 'generateUuid', (user, options) => {
    user.uuid = shortUuid.generate();
});
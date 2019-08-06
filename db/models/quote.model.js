const Sequelize = require('sequelize'),
    shortUuid = require('short-uuid');

module.exports = function(sequelize) {
    const Quote = sequelize.define('quote', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        uuid: {
            type: Sequelize.STRING,
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

    Quote.addHook('afterValidate', 'generateUuid', (user) => {
        user.uuid = shortUuid.generate();
    });

    return Quote;
}
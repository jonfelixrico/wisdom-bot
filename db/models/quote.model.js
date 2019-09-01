const Sequelize = require('sequelize'),
    uuid = require('short-uuid');

module.exports = function(sequelize) {
    const Quote = sequelize.define('quote', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        uuid: {
            type: Sequelize.STRING,
            allowNull: false
        },

        // references the user model
        submittedBy: {
            type: Sequelize.NUMBER,
            allowNull: false
        },

        // references the user model
        spokenBy: Sequelize.NUMBER,
        // if spokenBy is null, that means the quoted person is not a registered discord user
        // alias should have a string value that represents the quoted person
        alias: Sequelize.STRING,

        // content of the quote
        content: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        // the quote year to be appended after the name
        year: Sequelize.INTEGER,

        // timestamp of when the quote was submitted
        submittedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        expiresAt: {
            type: Sequelize.DATE,
            allowNull: false
        },

        // timestamp of when the quote was accepted
        acceptedAt: Sequelize.DATE
    });

    Quote.beforeCreate(function (quote) {
        quote.uuid = uuid();
    });

    return Quote;
}
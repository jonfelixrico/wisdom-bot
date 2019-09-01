const Sequelize = require('sequelize');

module.exports = function(sequelize) {
    const User = sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        // snowflake of a user
        snowflake: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },

        // the alias of a user, will be shown in quotes
        alias: Sequelize.STRING
    });

    return User;
}
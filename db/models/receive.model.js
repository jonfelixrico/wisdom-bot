const Sequelize = require('sequelize')

module.exports = function (sequelize) {
  const Receive = sequelize.define('receive', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    quoteId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    // references a user
    receivedBy: Sequelize.INTEGER,

    // references a subscription
    subscriptionId: Sequelize.INTEGER,

    // if receviedBy has a value, that means the quote was received through !wisdom receive
    // otherwise, subscriptionId should have a value. that means the quote was received through a daily quote subscription

    // timestamp for when the quote was called
    receivedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      default: Sequelize.NOW,
    },
  })

  return Receive
}

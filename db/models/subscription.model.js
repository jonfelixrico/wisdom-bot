const Sequelize = require('sequelize')

module.exports = function (sequelize) {
  const Subscription = sequelize.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // if subscribedBy is null, that means the row is a channel-wide subscription
    subscribedBy: Sequelize.STRING,
    subscribedAt: Sequelize.DATE,

    unsubscribedAt: Sequelize.DATE,

    channel: Sequelize.STRING,
  })

  return Subscription
}

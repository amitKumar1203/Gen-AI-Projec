const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'New Chat'
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

Conversation.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Conversation, { foreignKey: 'userId' });

module.exports = Conversation;

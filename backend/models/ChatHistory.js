const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Conversation = require('./Conversation');

const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: true, // nullable for migration; new messages always have it
    references: {
      model: Conversation,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'chat_history',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

ChatHistory.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
ChatHistory.belongsTo(Conversation, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
User.hasMany(ChatHistory, { foreignKey: 'userId' });
Conversation.hasMany(ChatHistory, { foreignKey: 'conversationId' });

module.exports = ChatHistory;

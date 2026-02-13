const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const ResumeAnalysis = sequelize.define('ResumeAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
  filename: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  jobRole: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'resume_analyses',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

ResumeAnalysis.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(ResumeAnalysis, { foreignKey: 'userId' });

module.exports = ResumeAnalysis;

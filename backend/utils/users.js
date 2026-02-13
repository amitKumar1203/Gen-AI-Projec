const User = require('../models/User');

// In-memory fallback storage
let memoryUsers = [];
let useMemory = false;

// Set memory mode (called when DB connection fails)
const setMemoryMode = (value) => {
  useMemory = value;
  if (value) {
    console.log('⚠️  Using in-memory user storage');
  }
};

// Find user by email
const findUserByEmail = async (email) => {
  try {
    if (useMemory) {
      return memoryUsers.find(user => user.email === email) || null;
    }
    const user = await User.findOne({ where: { email } });
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by email:', error.message);
    // Fallback to memory
    return memoryUsers.find(user => user.email === email) || null;
  }
};

// Find user by ID
const findUserById = async (id) => {
  try {
    if (useMemory) {
      const user = memoryUsers.find(user => user.id === id);
      if (user) {
        const { password, ...safeUser } = user;
        return safeUser;
      }
      return null;
    }
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'createdAt']
    });
    return user ? user.toJSON() : null;
  } catch (error) {
    console.error('Error finding user by id:', error.message);
    const user = memoryUsers.find(user => user.id === id);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }
};

// Create new user
const createUser = async (userData) => {
  try {
    if (useMemory) {
      memoryUsers.push(userData);
      return userData;
    }
    const user = await User.create(userData);
    return user.toJSON();
  } catch (error) {
    console.error('Error creating user:', error.message);
    // Fallback to memory
    memoryUsers.push(userData);
    return userData;
  }
};

// Get all users (without passwords)
const getAllUsers = async () => {
  try {
    if (useMemory) {
      return memoryUsers.map(({ password, ...user }) => user);
    }
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    return users.map(user => user.toJSON());
  } catch (error) {
    console.error('Error getting all users:', error.message);
    return memoryUsers.map(({ password, ...user }) => user);
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  setMemoryMode
};

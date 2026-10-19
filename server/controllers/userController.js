const User = require('../models/User');

// @desc    Search users by name or username
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      // If query is empty, return latest active users (excluding current user)
      const users = await User.find({ _id: { $ne: req.user._id } })
        .select('name username avatar bio isOnline lastSeen')
        .limit(20)
        .sort({ updatedAt: -1 });

      return res.status(200).json({ success: true, count: users.length, users });
    }

    const regex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { username: regex }, { email: regex }],
    })
      .select('name username avatar bio isOnline lastSeen')
      .limit(30);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name username avatar bio isOnline lastSeen createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUsers,
  getUserById,
};

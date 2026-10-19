const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getUserById,
} = require('../controllers/userController');
const {
  updateProfile,
  uploadAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUserById);
router.patch('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;

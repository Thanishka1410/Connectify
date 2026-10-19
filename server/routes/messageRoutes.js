const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
  reactToMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', upload.single('file'), sendMessage);
router.patch('/:id', updateMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/read', markAsRead);
router.post('/:id/react', reactToMessage);

module.exports = router;

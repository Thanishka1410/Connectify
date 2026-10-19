const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  createConversation,
  getConversationById,
  updateConversation,
  addMembers,
  removeMember,
  leaveConversation,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getUserConversations)
  .post(createConversation);

router.route('/:id')
  .get(getConversationById)
  .patch(updateConversation);

router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveConversation);

module.exports = router;

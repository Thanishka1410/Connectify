const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { processUploadedFile } = require('../middleware/upload');

// @desc    Get messages for a conversation with pagination and search
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, q } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Verify membership
    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view messages in this conversation.',
      });
    }

    const query = { conversation: conversationId };

    if (q && q.trim()) {
      query.text = { $regex: q.trim(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await Message.countDocuments(query);

    const messages = await Message.find(query)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'text sender attachments deletedAt isSystem',
        populate: { path: 'sender', select: 'name username avatar' },
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum);

    // Auto mark retrieved messages as read by current user
    await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text, replyTo } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required.',
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this conversation.',
      });
    }

    let attachments = [];
    if (req.file) {
      const processed = await processUploadedFile(req.file, req);
      if (processed) {
        attachments.push(processed);
      }
    }

    if ((!text || text.trim() === '') && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty. Please provide text or an attachment.',
      });
    }

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text ? text.trim() : '',
      attachments,
      replyTo: replyTo || null,
      readBy: [req.user._id],
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'text sender attachments deletedAt isSystem',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a message
// @route   PATCH /api/messages/:id
// @access  Private
const updateMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.deletedAt) {
      return res.status(400).json({ success: false, message: 'Deleted message cannot be edited.' });
    }

    if (message.isSystem) {
      return res.status(400).json({ success: false, message: 'System messages cannot be edited.' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages.',
      });
    }

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Updated text cannot be empty.' });
    }

    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();

    const updated = await Message.findById(message._id)
      .populate('sender', 'name username avatar')
      .populate({
        path: 'replyTo',
        select: 'text sender attachments deletedAt isSystem',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    res.status(200).json({
      success: true,
      message: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (soft delete)
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const conversation = await Conversation.findById(message.conversation);

    const isAuthor = message.sender && message.sender.toString() === req.user._id.toString();
    const isGroupAdmin =
      conversation &&
      conversation.admins.some((a) => a.toString() === req.user._id.toString());

    if (!isAuthor && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this message.',
      });
    }

    message.deletedAt = new Date();
    message.text = 'This message was deleted';
    message.attachments = [];
    await message.save();

    res.status(200).json({
      success: true,
      messageId: message._id,
      deletedAt: message.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a message as read
// @route   POST /api/messages/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    res.status(200).json({
      success: true,
      messageId: message._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or toggle emoji reaction to message
// @route   POST /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required.' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    res.status(200).json({
      success: true,
      messageId: message._id,
      reactions: message.reactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markAsRead,
  reactToMessage,
};

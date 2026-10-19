const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to check if user is a member of the conversation
const isMember = (conversation, userId) => {
  return conversation.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
};

// Helper to check if user is an admin of the conversation
const isAdmin = (conversation, userId) => {
  return conversation.admins.some(
    (adminId) => adminId.toString() === userId.toString()
  );
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/conversations
// @access  Private
const getUserConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] },
    })
      .populate('members', 'name username avatar bio isOnline lastSeen')
      .populate('admins', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username avatar',
        },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new conversation (Direct or Group)
// @route   POST /api/conversations
// @access  Private
const createConversation = async (req, res, next) => {
  try {
    const { type = 'direct', recipientId, name, description, avatar, memberIds = [] } = req.body;

    // DIRECT CONVERSATION
    if (type === 'direct') {
      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: 'Recipient ID is required for direct conversation.',
        });
      }

      if (recipientId.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot start a direct conversation with yourself.',
        });
      }

      // Check if conversation already exists between these 2 users
      let existingConv = await Conversation.findOne({
        type: 'direct',
        members: { $all: [req.user._id, recipientId], $size: 2 },
      })
        .populate('members', 'name username avatar bio isOnline lastSeen')
        .populate('lastMessage');

      if (existingConv) {
        return res.status(200).json({
          success: true,
          isExisting: true,
          conversation: existingConv,
        });
      }

      // Create new direct conversation
      const newConv = await Conversation.create({
        type: 'direct',
        members: [req.user._id, recipientId],
        admins: [req.user._id, recipientId],
        createdBy: req.user._id,
      });

      const populatedConv = await Conversation.findById(newConv._id)
        .populate('members', 'name username avatar bio isOnline lastSeen')
        .populate('createdBy', 'name username avatar');

      return res.status(201).json({
        success: true,
        conversation: populatedConv,
      });
    }

    // GROUP CONVERSATION
    if (type === 'group') {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Group name is required.',
        });
      }

      // Ensure creator is in the members list
      const membersSet = new Set([req.user._id.toString(), ...(memberIds || [])]);
      const uniqueMembers = Array.from(membersSet);

      const groupAvatar =
        avatar ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
          name.trim()
        )}&backgroundColor=4f46e5,7c3aed,06b6d4`;

      const newGroup = await Conversation.create({
        name: name.trim(),
        description: description ? description.trim() : '',
        avatar: groupAvatar,
        type: 'group',
        members: uniqueMembers,
        admins: [req.user._id],
        createdBy: req.user._id,
      });

      // Create system message
      const systemMessage = await Message.create({
        conversation: newGroup._id,
        sender: req.user._id,
        text: `${req.user.name} created group "${name.trim()}"`,
        isSystem: true,
      });

      newGroup.lastMessage = systemMessage._id;
      await newGroup.save();

      // Create notifications for invited members
      const notifications = uniqueMembers
        .filter((id) => id.toString() !== req.user._id.toString())
        .map((memberId) => ({
          recipient: memberId,
          sender: req.user._id,
          type: 'group_invite',
          conversation: newGroup._id,
          message: `${req.user.name} added you to group "${name.trim()}"`,
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      const populatedGroup = await Conversation.findById(newGroup._id)
        .populate('members', 'name username avatar bio isOnline lastSeen')
        .populate('admins', 'name username avatar')
        .populate('createdBy', 'name username avatar')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name username avatar' },
        });

      return res.status(201).json({
        success: true,
        conversation: populatedGroup,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid conversation type.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation details
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('members', 'name username avatar bio isOnline lastSeen')
      .populate('admins', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (!isMember(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this conversation.',
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group conversation details (name, description, avatar)
// @route   PATCH /api/conversations/:id
// @access  Private (Admins only for group)
const updateConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({
        success: false,
        message: 'Direct conversations cannot be updated.',
      });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only group administrators can update group settings.',
      });
    }

    const { name, description, avatar } = req.body;
    let changeSummary = [];

    if (name && name.trim() && name.trim() !== conversation.name) {
      changeSummary.push(`renamed group to "${name.trim()}"`);
      conversation.name = name.trim();
    }
    if (typeof description === 'string' && description.trim() !== conversation.description) {
      changeSummary.push(`updated group description`);
      conversation.description = description.trim();
    }
    if (avatar && avatar !== conversation.avatar) {
      changeSummary.push(`updated group avatar`);
      conversation.avatar = avatar;
    }

    await conversation.save();

    if (changeSummary.length > 0) {
      const sysMsg = await Message.create({
        conversation: conversation._id,
        sender: req.user._id,
        text: `${req.user.name} ${changeSummary.join(' and ')}`,
        isSystem: true,
      });
      conversation.lastMessage = sysMsg._id;
      await conversation.save();
    }

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'name username avatar bio isOnline lastSeen')
      .populate('admins', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      conversation: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member(s) to group
// @route   POST /api/conversations/:id/members
// @access  Private (Admins only)
const addMembers = async (req, res, next) => {
  try {
    const { userIds = [] } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs to add.',
      });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ success: false, message: 'Cannot add members to a direct chat.' });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admins can add members.' });
    }

    const addedUsers = [];
    for (const uId of userIds) {
      if (!isMember(conversation, uId)) {
        conversation.members.push(uId);
        addedUsers.push(uId);
      }
    }

    if (addedUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected users are already members of this group.',
      });
    }

    await conversation.save();

    // Create system message
    const users = await User.find({ _id: { $in: addedUsers } }).select('name');
    const userNames = users.map((u) => u.name).join(', ');

    const sysMsg = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: `${req.user.name} added ${userNames} to the group`,
      isSystem: true,
    });

    conversation.lastMessage = sysMsg._id;
    await conversation.save();

    // Notifications
    const notifications = addedUsers.map((uid) => ({
      recipient: uid,
      sender: req.user._id,
      type: 'member_added',
      conversation: conversation._id,
      message: `${req.user.name} added you to group "${conversation.name}"`,
    }));
    await Notification.insertMany(notifications);

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'name username avatar bio isOnline lastSeen')
      .populate('admins', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      message: 'Members added successfully.',
      conversation: updated,
      systemMessage: sysMsg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group
// @route   DELETE /api/conversations/:id/members/:userId
// @access  Private (Admins only)
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ success: false, message: 'Cannot remove member from direct chat.' });
    }

    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
    }

    if (!isMember(conversation, userId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this group.' });
    }

    // Remove from members and admins
    conversation.members = conversation.members.filter(
      (m) => m.toString() !== userId.toString()
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== userId.toString()
    );

    // If no admin left, promote the next member
    if (conversation.admins.length === 0 && conversation.members.length > 0) {
      conversation.admins.push(conversation.members[0]);
    }

    await conversation.save();

    const removedUser = await User.findById(userId).select('name');
    const sysMsg = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: `${req.user.name} removed ${removedUser ? removedUser.name : 'a user'} from the group`,
      isSystem: true,
    });

    conversation.lastMessage = sysMsg._id;
    await conversation.save();

    // Create notification for removed user
    await Notification.create({
      recipient: userId,
      sender: req.user._id,
      type: 'member_removed',
      conversation: conversation._id,
      message: `You were removed from group "${conversation.name}" by ${req.user.name}`,
    });

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'name username avatar bio isOnline lastSeen')
      .populate('admins', 'name username avatar')
      .populate('createdBy', 'name username avatar')
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully.',
      conversation: updated,
      systemMessage: sysMsg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave group
// @route   POST /api/conversations/:id/leave
// @access  Private
const leaveConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ success: false, message: 'Cannot leave a direct conversation.' });
    }

    if (!isMember(conversation, req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are not a member of this group.' });
    }

    // Remove user
    conversation.members = conversation.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== req.user._id.toString()
    );

    // If there are still members but no admin, promote first member
    if (conversation.admins.length === 0 && conversation.members.length > 0) {
      conversation.admins.push(conversation.members[0]);
    }

    const sysMsg = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: `${req.user.name} left the group`,
      isSystem: true,
    });

    conversation.lastMessage = sysMsg._id;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'You have left the group.',
      systemMessage: sysMsg,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserConversations,
  createConversation,
  getConversationById,
  updateConversation,
  addMembers,
  removeMember,
  leaveConversation,
};

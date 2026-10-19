const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Map of userId -> Set of socket IDs for multi-tab/device tracking
const userSocketMap = new Map();

const initSocket = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        token = socket.handshake.headers.authorization.split(' ')[1];
      }

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const c of cookies) {
          const [key, val] = c.trim().split('=');
          if (key === 'token') {
            token = val;
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'connectify_development_secret_key_384729104712049'
      );

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    // Track user active sockets
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    // Join personal room for private notifications
    socket.join(`user_${userId}`);

    // Update database status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Send currently online user IDs to the connected client
    const onlineUserIds = Array.from(userSocketMap.keys());
    socket.emit('online_users_list', onlineUserIds);

    // Broadcast to everyone that this user is online
    socket.broadcast.emit('user_online', {
      userId,
      user: {
        _id: socket.user._id,
        name: socket.user.name,
        username: socket.user.username,
        avatar: socket.user.avatar,
      },
    });

    // 1. Join Conversation Room
    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found' });
          return;
        }

        const isMember = conversation.members.some(
          (m) => m.toString() === userId
        );

        if (!isMember) {
          if (callback) callback({ error: 'Unauthorized: You are not a member' });
          return;
        }

        socket.join(`conv_${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // 2. Leave Conversation Room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
      }
    });

    // 3. Send Message via Socket (with persistent DB saving)
    socket.on('send_message', async (data, callback) => {
      try {
        const { conversationId, text, replyTo, attachments = [] } = data;

        if (!conversationId) {
          if (callback) callback({ error: 'Conversation ID required' });
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (callback) callback({ error: 'Conversation not found' });
          return;
        }

        const isMember = conversation.members.some(
          (m) => m.toString() === userId
        );
        if (!isMember) {
          if (callback) callback({ error: 'Unauthorized to post to this conversation' });
          return;
        }

        if ((!text || !text.trim()) && (!attachments || attachments.length === 0)) {
          if (callback) callback({ error: 'Message must have text or attachment' });
          return;
        }

        // Persist message in MongoDB
        const newMessage = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text ? text.trim() : '',
          attachments: attachments || [],
          replyTo: replyTo || null,
          readBy: [userId],
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

        // Broadcast to everyone inside the conversation room
        io.to(`conv_${conversationId}`).emit('receive_message', populatedMessage);

        // Also notify each member's private room to update sidebar last message & unread badge
        conversation.members.forEach((memberId) => {
          io.to(`user_${memberId.toString()}`).emit('conversation_updated', {
            conversationId,
            lastMessage: populatedMessage,
            senderId: userId,
          });
        });

        if (callback) callback({ success: true, message: populatedMessage });
      } catch (err) {
        console.error('[Socket send_message error]', err);
        if (callback) callback({ error: err.message });
      }
    });

    // 4. Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('typing_start', {
        conversationId,
        user: {
          _id: socket.user._id,
          name: socket.user.name,
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('typing_stop', {
        conversationId,
        userId,
      });
    });

    // 5. Message Read Acknowledgment
    socket.on('message_read', async ({ conversationId, messageId }) => {
      try {
        if (!messageId) return;
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: userId },
        });

        io.to(`conv_${conversationId}`).emit('message_read', {
          conversationId,
          messageId,
          userId,
        });
      } catch (err) {
        console.error('[Socket message_read error]', err);
      }
    });

    // 6. Message Reaction
    socket.on('message_reaction', async ({ conversationId, messageId, emoji }) => {
      try {
        if (!messageId || !emoji) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIndex = message.reactions.findIndex(
          (r) => r.user.toString() === userId && r.emoji === emoji
        );

        if (existingIndex > -1) {
          message.reactions.splice(existingIndex, 1);
        } else {
          message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        io.to(`conv_${conversationId}`).emit('message_reaction_updated', {
          conversationId,
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error('[Socket reaction error]', err);
      }
    });

    // 7. Message Edited
    socket.on('message_edited', ({ conversationId, message }) => {
      io.to(`conv_${conversationId}`).emit('message_edited', {
        conversationId,
        message,
      });
    });

    // 8. Message Deleted
    socket.on('message_deleted', ({ conversationId, messageId, deletedAt }) => {
      io.to(`conv_${conversationId}`).emit('message_deleted', {
        conversationId,
        messageId,
        deletedAt,
      });
    });

    // 9. Conversation Membership Change (member added/removed/left)
    socket.on('conversation_changed', ({ conversationId, action, data }) => {
      io.to(`conv_${conversationId}`).emit('conversation_changed', {
        conversationId,
        action,
        data,
      });
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketMap.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          socket.broadcast.emit('user_offline', { userId, lastSeen });
        }
      }
    });
  });
};

module.exports = {
  initSocket,
  userSocketMap,
};

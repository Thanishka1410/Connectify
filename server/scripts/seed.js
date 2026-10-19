require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connectify';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({
      username: { $in: ['demo_user', 'sarah_connor', 'marcus_v', 'elena_r'] },
    });

    console.log('[Seed] Creating demo users...');
    const users = await User.create([
      {
        name: 'Alex Morgan',
        username: 'demo_user',
        email: 'demo@connectify.com',
        passwordHash: 'connectify123',
        bio: 'Full-stack developer building Connectify.',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Morgan&backgroundColor=6366f1',
        isOnline: true,
      },
      {
        name: 'Sarah Connor',
        username: 'sarah_connor',
        email: 'sarah@connectify.com',
        passwordHash: 'connectify123',
        bio: 'Cybersecurity researcher & open-source enthusiast.',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Connor&backgroundColor=8b5cf6',
        isOnline: true,
      },
      {
        name: 'Marcus Vance',
        username: 'marcus_v',
        email: 'marcus@connectify.com',
        passwordHash: 'connectify123',
        bio: 'UI/UX designer crafting clean interfaces.',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Marcus%20Vance&backgroundColor=ec4899',
        isOnline: false,
      },
      {
        name: 'Elena Rostova',
        username: 'elena_r',
        email: 'elena@connectify.com',
        passwordHash: 'connectify123',
        bio: 'Cloud architect & distributed systems engineer.',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Elena%20Rostova&backgroundColor=10b981',
        isOnline: true,
      },
    ]);

    const [alex, sarah, marcus, elena] = users;

    console.log('[Seed] Creating demo group conversation...');
    const group = await Conversation.create({
      name: 'Connectify Core Team',
      description: 'Official development and launch discussions for Connectify',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Connectify%20Core%20Team&backgroundColor=4f46e5',
      type: 'group',
      members: [alex._id, sarah._id, marcus._id, elena._id],
      admins: [alex._id],
      createdBy: alex._id,
    });

    // Create group messages
    const sysMsg = await Message.create({
      conversation: group._id,
      sender: alex._id,
      text: `${alex.name} created group "Connectify Core Team"`,
      isSystem: true,
      createdAt: new Date(Date.now() - 3600000 * 3),
    });

    const m1 = await Message.create({
      conversation: group._id,
      sender: alex._id,
      text: 'Hey team! Welcome to the Connectify launch discussion room! 🎉',
      readBy: [alex._id, sarah._id, elena._id],
      createdAt: new Date(Date.now() - 3600000 * 2),
    });

    const m2 = await Message.create({
      conversation: group._id,
      sender: sarah._id,
      text: 'Real-time WebSocket delivery is functioning nicely! Sub-second latency confirmed. ⚡',
      readBy: [alex._id, sarah._id, elena._id],
      reactions: [{ user: alex._id, emoji: '🔥' }],
      createdAt: new Date(Date.now() - 3600000 * 1.5),
    });

    const m3 = await Message.create({
      conversation: group._id,
      sender: marcus._id,
      text: 'The responsive three-column layout looks great on both laptop and mobile viewports.',
      readBy: [alex._id, sarah._id],
      replyTo: m2._id,
      createdAt: new Date(Date.now() - 3600000 * 1),
    });

    const m4 = await Message.create({
      conversation: group._id,
      sender: elena._id,
      text: 'MongoDB indexes, JWT validation, and rate limiting are all verified. We are ready for production.',
      readBy: [alex._id, elena._id],
      createdAt: new Date(Date.now() - 1800000),
    });

    group.lastMessage = m4._id;
    await group.save();

    console.log('[Seed] Creating demo direct conversation...');
    const direct = await Conversation.create({
      type: 'direct',
      members: [alex._id, sarah._id],
      admins: [alex._id, sarah._id],
      createdBy: alex._id,
    });

    const dm1 = await Message.create({
      conversation: direct._id,
      sender: sarah._id,
      text: 'Hey Alex, could you review the new group admin authorization middleware?',
      readBy: [alex._id, sarah._id],
      createdAt: new Date(Date.now() - 1200000),
    });

    const dm2 = await Message.create({
      conversation: direct._id,
      sender: alex._id,
      text: 'Looking at it now! Clean implementation with role checks.',
      readBy: [alex._id, sarah._id],
      createdAt: new Date(Date.now() - 600000),
    });

    direct.lastMessage = dm2._id;
    await direct.save();

    console.log('========================================================');
    console.log('  Database seeded successfully with demo accounts:');
    console.log('  Username: demo_user    | Password: connectify123');
    console.log('  Username: sarah_connor | Password: connectify123');
    console.log('  Username: marcus_v     | Password: connectify123');
    console.log('  Username: elena_r      | Password: connectify123');
    console.log('========================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
};

seedData();

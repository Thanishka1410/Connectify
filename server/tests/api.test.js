const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Connectify API Tests', () => {
  test('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.appName).toBe('Connectify Backend API');
  });

  test('POST /api/auth/register should create a user and return a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Johnson',
        username: 'alicej',
        email: 'alice@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Alice Johnson');
    expect(res.body.user.username).toBe('alicej');
    expect(res.body.user.email).toBe('alice@example.com');
    // Ensure passwordHash is not returned in user object
    expect(res.body.user.passwordHash).toBeUndefined();

    // Verify user in DB has hashed password
    const userInDb = await User.findOne({ email: 'alice@example.com' });
    expect(userInDb).toBeTruthy();
    expect(userInDb.passwordHash).not.toBe('password123');
  });

  test('POST /api/auth/login should authenticate user with valid credentials', async () => {
    // Register user first
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Smith',
        username: 'bobsmith',
        email: 'bob@example.com',
        password: 'securepassword',
      });

    // Login with username
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'bobsmith',
        password: 'securepassword',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('bobsmith');
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Protected conversation and message workflow', async () => {
    // 1. Create two users
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        username: 'userone',
        email: 'user1@example.com',
        password: 'password123',
      });
    const token1 = user1Res.body.token;
    const user1Id = user1Res.body.user._id;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        username: 'usertwo',
        email: 'user2@example.com',
        password: 'password123',
      });
    const user2Id = user2Res.body.user._id;

    // 2. Create a group conversation
    const groupRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        type: 'group',
        name: 'Project Discussion Group',
        description: 'Coordination for Connectify launch',
        memberIds: [user2Id],
      });

    expect(groupRes.status).toBe(201);
    expect(groupRes.body.success).toBe(true);
    expect(groupRes.body.conversation.name).toBe('Project Discussion Group');
    expect(groupRes.body.conversation.members.length).toBe(2);

    const convId = groupRes.body.conversation._id;

    // 3. Post a message to the group
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        conversationId: convId,
        text: 'Welcome to the team chat!',
      });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.message.text).toBe('Welcome to the team chat!');

    // 4. Retrieve messages for the group
    const getMsgsRes = await request(app)
      .get(`/api/messages/${convId}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(getMsgsRes.status).toBe(200);
    // There will be 2 messages: the initial system message and the user message
    expect(getMsgsRes.body.messages.length).toBeGreaterThanOrEqual(2);
  });
});

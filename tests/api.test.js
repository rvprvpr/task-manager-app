const request = require('supertest');
const { app, db } = require('../backend/server');
const fs = require('fs');
const path = require('path');

describe('API Endpoints', () => {
    const testDbPath = path.join(__dirname, 'api-test.db');

    beforeAll(async () => {
        await db.connect();
        await db.initialize();
    });

    beforeEach(async () => {
        if (db.db) {
            await new Promise((resolve, reject) => {
                db.db.run('DELETE FROM tasks', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    });

    afterAll(async () => {
        if (db) {
            db.close();
        }
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('GET /health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: 'Server is running'
            });
        });
    });

    describe('POST /api/tasks', () => {
        test('should create task with valid data', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'Test description',
                priority: 'high'
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(taskData.title);
            expect(response.body.data.description).toBe(taskData.description);
            expect(response.body.data.priority).toBe(taskData.priority);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.created_at).toBeDefined();
        });

        test('should create task with minimal data (title only)', async () => {
            const taskData = { title: 'Minimal Task' };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(taskData.title);
            expect(response.body.data.priority).toBe('medium');
        });

        test('should reject task without title', async () => {
            const taskData = { description: 'No title' };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeDefined();
        });

        test('should reject task with empty title', async () => {
            const taskData = { title: '' };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        test('should reject task with invalid priority', async () => {
            const taskData = {
                title: 'Valid Title',
                priority: 'invalid'
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors.some(err => err.path === 'priority')).toBe(true);
        });

        test('should reject task with title longer than 255 characters', async () => {
            const taskData = {
                title: 'a'.repeat(256)
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/tasks', () => {
        test('should return empty array when no tasks exist', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/tasks/:id', () => {
        test('should return 404 for non-existent task', async () => {
            const response = await request(app)
                .get('/api/tasks/999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Task not found');
        });
    });

    describe('404 handling', () => {
        test('should return 404 for unknown routes', async () => {
            const response = await request(app)
                .get('/unknown-route')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Route not found');
        });
    });
});

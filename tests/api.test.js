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

    describe('PUT /api/tasks/:id', () => {
        test('should update task fields', async () => {
            const createRes = await request(app).post('/api/tasks').send({ title: 'A', priority: 'low' }).expect(201);
            const id = createRes.body.data.id;
            const res = await request(app).put(`/api/tasks/${id}`).send({ title: 'B', priority: 'high' }).expect(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe('B');
            expect(res.body.data.priority).toBe('high');
        });

        test('should return 400 when no fields provided', async () => {
            const createRes = await request(app).post('/api/tasks').send({ title: 'A' }).expect(201);
            const id = createRes.body.data.id;
            const res = await request(app).put(`/api/tasks/${id}`).send({}).expect(400);
            expect(res.body.success).toBe(false);
        });

        test('should validate fields and return 400', async () => {
            const createRes = await request(app).post('/api/tasks').send({ title: 'A' }).expect(201);
            const id = createRes.body.data.id;
            await request(app).put(`/api/tasks/${id}`).send({ title: '' }).expect(400);
            await request(app).put(`/api/tasks/${id}`).send({ priority: 'invalid' }).expect(400);
        });

        test('should return 404 when updating missing task', async () => {
            const res = await request(app).put('/api/tasks/99999').send({ title: 'X' }).expect(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        test('should delete existing task', async () => {
            const createRes = await request(app).post('/api/tasks').send({ title: 'To delete' }).expect(201);
            const id = createRes.body.data.id;
            const delRes = await request(app).delete(`/api/tasks/${id}`).expect(200);
            expect(delRes.body.success).toBe(true);
            await request(app).get(`/api/tasks/${id}`).expect(404);
        });

        test('should return 404 for non-existent task', async () => {
            const res = await request(app).delete('/api/tasks/123456').expect(404);
            expect(res.body.success).toBe(false);
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

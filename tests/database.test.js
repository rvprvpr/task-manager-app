const Database = require('../backend/database');
const fs = require('fs');
const path = require('path');

describe('Database Tests', () => {
    let db;
    const testDbPath = path.join(__dirname, 'test.db');

    beforeEach(async () => {
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        db = new Database();
        db.connect = () => {
            return new Promise((resolve, reject) => {
                const sqlite3 = require('sqlite3').verbose();
                db.db = new sqlite3.Database(testDbPath, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };
        
        await db.connect();
        await db.initialize();
    });

    afterEach(async () => {
        if (db) {
            db.close();
        }
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('Schema Validation', () => {
        test('should create tasks table with correct columns', async () => {
            const tableInfo = await new Promise((resolve, reject) => {
                db.db.all("PRAGMA table_info(tasks)", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            expect(tableInfo).toHaveLength(5);
            
            const columns = tableInfo.reduce((acc, col) => {
                acc[col.name] = col;
                return acc;
            }, {});

            expect(columns.id).toBeDefined();
            expect(columns.id.type).toBe('INTEGER');
            expect(columns.id.pk).toBe(1);

            expect(columns.title).toBeDefined();
            expect(columns.title.type).toBe('TEXT');
            expect(columns.title.notnull).toBe(1);

            expect(columns.description).toBeDefined();
            expect(columns.description.type).toBe('TEXT');
            expect(columns.description.notnull).toBe(0);

            expect(columns.priority).toBeDefined();
            expect(columns.priority.type).toBe('TEXT');
            expect(columns.priority.dflt_value).toBe("'medium'");

            expect(columns.created_at).toBeDefined();
            expect(columns.created_at.type).toBe('DATETIME');
            expect(columns.created_at.dflt_value).toBe('CURRENT_TIMESTAMP');
        });

        test('should have correct indexes', async () => {
            const indexes = await new Promise((resolve, reject) => {
                db.db.all("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='tasks'", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            const indexNames = indexes.map(idx => idx.name);
            expect(indexNames).toContain('idx_tasks_priority');
            expect(indexNames).toContain('idx_tasks_created_at');
        });
    });

    describe('Valid Task Insertion', () => {
        test('should insert task with all fields', async () => {
            const task = await db.createTask('Test Task', 'Test description', 'high');
            
            expect(task).toBeDefined();
            expect(task.id).toBeDefined();
            expect(task.title).toBe('Test Task');
            expect(task.description).toBe('Test description');
            expect(task.priority).toBe('high');
            expect(task.created_at).toBeDefined();
        });

        test('should insert task with minimal fields (title only)', async () => {
            const task = await db.createTask('Minimal Task');
            
            expect(task).toBeDefined();
            expect(task.id).toBeDefined();
            expect(task.title).toBe('Minimal Task');
            expect(task.description).toBeNull();
            expect(task.priority).toBe('medium');
            expect(task.created_at).toBeDefined();
        });

        test('should insert task with title and description only', async () => {
            const task = await db.createTask('Task with desc', 'Some description');
            
            expect(task).toBeDefined();
            expect(task.title).toBe('Task with desc');
            expect(task.description).toBe('Some description');
            expect(task.priority).toBe('medium');
        });

        test('should auto-increment task IDs', async () => {
            const task1 = await db.createTask('First Task');
            const task2 = await db.createTask('Second Task');
            
            expect(task2.id).toBe(task1.id + 1);
        });
    });

    describe('Invalid Task Insertion', () => {
        test('should reject task with empty title', async () => {
            await expect(db.createTask('')).rejects.toThrow();
        });

        test('should reject task with null title', async () => {
            await expect(db.createTask(null)).rejects.toThrow();
        });

        test('should reject task with undefined title', async () => {
            await expect(db.createTask(undefined)).rejects.toThrow();
        });

        test('should reject task with title longer than 255 characters', async () => {
            const longTitle = 'a'.repeat(256);
            await expect(db.createTask(longTitle)).rejects.toThrow();
        });

        test('should reject task with invalid priority', async () => {
            await expect(db.createTask('Valid Title', 'Description', 'invalid')).rejects.toThrow();
        });

        test('should reject task with numeric priority', async () => {
            await expect(db.createTask('Valid Title', 'Description', 1)).rejects.toThrow();
        });
    });

    describe('Task Retrieval', () => {
        test('should retrieve all tasks', async () => {
            await db.createTask('Task 1');
            await db.createTask('Task 2');
            
            const tasks = await db.getAllTasks();
            expect(tasks).toHaveLength(2);
            expect(tasks[0].title).toBe('Task 2');
            expect(tasks[1].title).toBe('Task 1');
        });

        test('should retrieve task by ID', async () => {
            const created = await db.createTask('Test Task');
            const retrieved = await db.getTaskById(created.id);
            
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.title).toBe('Test Task');
        });

        test('should return undefined for non-existent task ID', async () => {
            const task = await db.getTaskById(999);
            expect(task).toBeUndefined();
        });
    });
});

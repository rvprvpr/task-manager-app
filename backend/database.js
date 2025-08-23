const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '..', 'database', 'tasks.db');
            
            const dbDir = path.dirname(dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    async initialize() {
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing database:', err.message);
                    reject(err);
                } else {
                    console.log('Database schema initialized successfully');
                    resolve();
                }
            });
        });
    }

    async createTask(title, description = null, priority = 'medium') {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO tasks (title, description, priority)
                VALUES (?, ?, ?)
            `;
            
            this.db.run(sql, [title, description, priority], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        title,
                        description,
                        priority,
                        created_at: new Date().toISOString()
                    });
                }
            });
        });
    }

    async getAllTasks() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getTaskById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM tasks WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateTask(id, fields) {
        return new Promise((resolve, reject) => {
            const sets = [];
            const params = [];
            if (Object.prototype.hasOwnProperty.call(fields, 'title')) {
                sets.push('title = ?');
                params.push(fields.title);
            }
            if (Object.prototype.hasOwnProperty.call(fields, 'description')) {
                sets.push('description = ?');
                params.push(fields.description);
            }
            if (Object.prototype.hasOwnProperty.call(fields, 'priority')) {
                sets.push('priority = ?');
                params.push(fields.priority);
            }
            if (sets.length === 0) {
                this.getTaskById(id).then(resolve).catch(reject);
                return;
            }
            const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`;
            this.db.run(sql, [...params, id], async (err) => {
                if (err) {
                    reject(err);
                } else {
                    const updated = await this.getTaskById(id);
                    resolve(updated || null);
                }
            });
        });
    }

    async deleteTask(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM tasks WHERE id = ?';
            this.db.run(sql, [id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;

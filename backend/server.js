const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

const db = new Database();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await db.getAllTasks();
        res.json({
            success: true,
            data: tasks,
            message: 'Tasks retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: error.message
        });
    }
});

app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await db.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        res.json({
            success: true,
            data: task,
            message: 'Task retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task',
            error: error.message
        });
    }
});

app.post('/api/tasks',
    [
        body('title')
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 1, max: 255 })
            .withMessage('Title must be between 1 and 255 characters'),
        body('description')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Description must not exceed 1000 characters'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high'])
            .withMessage('Priority must be low, medium, or high')
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const { title, description, priority } = req.body;
            const task = await db.createTask(title, description, priority);
            
            res.status(201).json({
                success: true,
                data: task,
                message: 'Task created successfully'
            });
        } catch (error) {
            console.error('Error creating task:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create task',
                error: error.message
            });
        }
    }
);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

async function startServer() {
    try {
        await db.connect();
        await db.initialize();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    process.exit(0);
});

if (require.main === module) {
    startServer();
}

module.exports = { app, db };

import express from 'express';
import { connectMongo, Task } from '../shared/database.js';
import { authenticate } from '../shared/auth.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Database check middleware
app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database service unavailable' });
  }
});

// Enforce auth on all routes
app.use(authenticate);

// 1. Fetch Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId || 'demo';
    const tasks = await Task.find({ workspaceId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 2. Create Task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status, assignee, dueDate } = req.body;
    const workspaceId = req.user.workspaceId || 'demo';

    const newTask = await Task.create({
      workspaceId,
      title,
      description: description || '',
      status: status || 'todo',
      assignee: assignee || '',
      dueDate: dueDate ? new Date(dueDate) : null
    });

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// 3. Update Task Status (or other fields)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { status, title, description, assignee, dueDate } = req.body;
    const workspaceId = req.user.workspaceId || 'demo';

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (assignee !== undefined) updateFields.assignee = assignee;
    if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, workspaceId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 4. Delete Task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId || 'demo';
    await Task.findOneAndDelete({ _id: req.params.id, workspaceId });
    res.json({ message: 'Task permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'tasks-service' });
});

const PORT = 3106;
app.listen(PORT, () => {
  console.log(`✅ [Tasks Service] Running on http://localhost:${PORT}`);
});

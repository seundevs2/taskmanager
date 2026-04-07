const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database('tasks.db');
const PORT = 3000;

// Init DB
db.exec(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const result = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title);
  res.json({ id: result.lastInsertRowid, title, done: 0 });
});

app.patch('/api/tasks/:id', (req, res) => {
  const { done } = req.body;
  db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(done ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  const done = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done = 1').get();
  const pending = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE done = 0').get();
  res.json({
    total: total.count,
    completed: done.count,
    pending: pending.count
  });
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

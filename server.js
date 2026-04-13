require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Init table
pool.query(`CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const result = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title]
  );
  res.json(result.rows[0]);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { done } = req.body;
  await pool.query('UPDATE tasks SET done = $1 WHERE id = $2', [done, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

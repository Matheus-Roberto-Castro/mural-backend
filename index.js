require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const notificationsRoutes = require('./routes/notifications');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/notifications', notificationsRoutes);

const PORT = process.env.PORT || 4000;

const initDb = async () => {
  try {
    const sqlPath = path.join(__dirname, 'migrations', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log("Tabelas verificadas/criadas com sucesso!");
  } catch (err) {
    console.error("Erro ao inicializar o banco:", err.message);
  }
};

app.listen(PORT, async () => {await initDb(); console.log(`Server running on port ${PORT}`)})
module.exports = app;
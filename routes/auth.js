const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

    const exist = await db.query('SELECT id FROM admins WHERE username=$1', [username]);
    if (exist.rows.length) return res.status(409).json({ error: 'Usuário já existe' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hash]
    );

    res.status(201).json({ admin: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

    const result = await db.query(
      'SELECT * FROM admins WHERE username=$1',
      [username]
    );

    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    const payload = { 
      id: admin.id, 
      username: admin.username, 
      role: "admin"    
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '1d' 
    });

    res.json({ token, admin: { id: admin.id, username: admin.username} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;

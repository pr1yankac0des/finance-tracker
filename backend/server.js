const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const JWT_SECRET = "finance_secret_key_2026"; 

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).json({ message: "User created" });
    } catch (err) {
        res.status(400).json({ error: "Email already registered" });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, rows[0].password);
        if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: rows[0].id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { email: rows[0].email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TRANSACTION ROUTES ---

app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM transactions ORDER BY date DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { type, category, amount, date } = req.body;
    try {
        await db.execute(
            'INSERT INTO transactions (type, category, amount, date) VALUES (?, ?, ?, ?)',
            [type, category, amount, date]
        );
        res.status(201).json({ message: "Saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions/delete', async (req, res) => {
    const { id } = req.body;
    try {
        await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Define a dynamic port using environment variables
const PORT = process.env.PORT || 5000;

// 2. Update the listener to use the dynamic PORT and '0.0.0.0' for external access
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
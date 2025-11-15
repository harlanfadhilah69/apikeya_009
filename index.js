const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2'); // <-- DITAMBAHKAN
const app = express();
const port = 3000;

// --- 1. KONFIGURASI DAN KONEKSI DATABASE ---
const db = mysql.createConnection({
    host: '172.27.208.1', 
    user: 'root',
    port: 3308, // <--- REKOMENDASI: KEMBALIKAN KE 3306, ATAU UBAH SESUAI KONFIGURASI ANDA
    password: 'harlan$12',
    database: 'api_key'
});

db.connect((err) => {
    if (err) {
        console.error('--- KRITIS: KONEKSI DATABASE GAGAL ---');
        console.error('Error connecting to MySQL:', err.message);
        console.error('PASTIKAN MySQL SERVER ANDA BERJALAN di port ' + db.config.port);
        // Biarkan Node.js berjalan, tetapi rute /create akan error
        return; 
    }
    console.log('✅ Successfully connected to MySQL database (api_key).');
});
// --- Akhir Bagian Database ---

// Middleware untuk membaca JSON body
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 'VARIABEL' Set DIHAPUS ---
// const validApiKeys = new Set(); // <-- Dihapus, diganti database

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 2. MODIFIKASI ENDPOINT /create ---
app.post('/create', (req, res) => {
    try {
        const randomBytes = crypto.randomBytes(32);
        const token = randomBytes.toString('base64url');
        const stamp = Date.now().toString();
        let apiKey = 'jayjo_' + `${token}_${stamp}`;

        // Ganti validApiKeys.add() dengan INSERT ke database
        const sqlQuery = 'INSERT INTO api_key (KeyValue) VALUES (?)';

        db.query(sqlQuery, [apiKey], (err, results) => {
            if (err) {
                console.error('Gagal menyimpan API key ke DB:', err);
                return res.status(500).json({ error: 'Gagal menyimpan key di server' });
            }
            
            console.log('Key baru disimpan ke database:', apiKey);
            res.status(200).json({ apiKey: apiKey });
        });

    } catch (error) {
        console.error('Gagal membuat API key (crypto error):', error);
        res.status(500).json({ error: 'Gagal membuat API key di server' });
    }
});

// --- 3. MODIFIKASI ENDPOINT /check ---
app.post('/check', (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'API key tidak ada di body' });
    }

    // Ganti validApiKeys.has() dengan SELECT dari database
    const sqlQuery = 'SELECT COUNT(*) AS count FROM api_key WHERE KeyValue = ?';

    db.query(sqlQuery, [apiKey], (err, results) => {
        if (err) {
            console.error('Gagal mengecek API key:', err);
            return res.status(500).json({ error: 'Gagal memvalidasi key di server' });
        }

        // results[0].count akan berisi 0 (jika tidak ada) atau 1 (jika ada)
        if (results[0].count > 0) {
            // Ditemukan, key valid
            res.status(200).json({ valid: true, message: 'API key valid' });
        } else {
            // Tidak ditemukan, key tidak valid
            res.status(401).json({ valid: false, message: 'API key tidak valid' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
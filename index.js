const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Middleware Penting: Mengizinkan Express membaca body request JSON/URL-encoded
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rute GET untuk menyajikan halaman utama (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Rute POST: Membuat API Key ---
app.post('/create', (req, res) => {
    try {
        const username = req.body.username || 'Anonim'; 
        
        // Buat 32 byte angka acak yang aman
        const randomBytes = crypto.randomBytes(32);
        const rawToken = randomBytes.toString('base64url'); 
        const finalApiKey = `mh_${rawToken}`; // Contoh prefix

        // Di sini seharusnya ada logika penyimpanan ke database
        console.log(`[SERVER] API Key baru dibuat untuk ${username}: ${finalApiKey}`);

        res.status(201).json({ 
            success: true,
            apiKey: finalApiKey,
            message: 'API Key berhasil dibuat dan siap disalin.'
        });
        
    } catch (error) {
        console.error('Error saat membuat API Key:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat membuat API Key.' 
        });
    }
});
  
// --- Rute POST: Memvalidasi API Key ---
app.post('/validate', (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API Key diperlukan untuk validasi.' });
    }
    
    // Logika Validasi (Sederhana untuk demo):
    const isValidPrefix = apiKey.startsWith('mh_');
    const isValidLength = apiKey.length >= 45; 

    if (isValidPrefix && isValidLength) {
        console.log(`[SERVER] API Key ${apiKey} VALID.`);
        return res.status(200).json({ 
            success: true, 
            message: 'Kunci VALID dan AKTIF.',
            status: 'Active' 
        });
    } else {
        console.log(`[SERVER] API Key ${apiKey} TIDAK VALID.`);
        return res.status(403).json({ 
            success: false, 
            message: 'Kunci TIDAK VALID. Format salah atau tidak terdaftar.',
            status: 'Inactive' 
        });
    }
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`); 
});
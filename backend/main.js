const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('chirie_auto.db');

app.use(cors());
app.use(bodyParser.json());

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS masini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  
    model TEXT, 
    pretPZ REAL,
    detaliiMotor TEXT,
    anul INTEGER,
    rezervata INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS Inchirieri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_masina INTEGER,
    id_client INTEGER,
    data_inceput DATE,
    data_sfarsit DATE,
    FOREIGN KEY (id_masina) REFERENCES masini(id),
    FOREIGN KEY (id_client) REFERENCES User(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS User(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nume TEXT,
    email TEXT,
    parola TEXT
  )`);
});

// ✅ Adăugare mașină
app.post('/api/masini', (req, res) => {
  const { model, pretPZ, detaliiMotor, anul } = req.body;
  db.run(
    `INSERT INTO masini (model, pretPZ, detaliiMotor, anul) VALUES (?, ?, ?, ?)`,
    [model, pretPZ, detaliiMotor, anul],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// 🔍 Listare mașini
app.get('/api/masini', (req, res) => {
  db.all(`SELECT * FROM masini`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Înregistrare utilizator
app.post('/api/inregistrare', (req, res) => {
  const { nume, email, parola } = req.body;
  db.run(
    `INSERT INTO User (nume, email, parola) VALUES (?, ?, ?)`,
    [nume, email, parola],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// 🔑 Autentificare utilizator
app.post('/api/autentificare', (req, res) => {
  const { email, parola } = req.body;
  db.get(
    `SELECT * FROM User WHERE email = ? AND parola = ?`,
    [email, parola],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Invalid login' });
      res.json(row);
    }
  );
});

// ✅ Înregistrare închiriere
app.post('/api/inchiriere', (req, res) => {
  const { id_masina, id_client, data_inceput, data_sfarsit } = req.body;
  db.run(
    `INSERT INTO Inchirieri (id_masina, id_client, data_inceput, data_sfarsit) VALUES (?, ?, ?, ?)`,
    [id_masina, id_client, data_inceput, data_sfarsit],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // actualizează mașina ca rezervată
      db.run(`UPDATE masini SET rezervata = 1 WHERE id = ?`, [id_masina]);
      res.json({ id: this.lastID });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe http://localhost:${PORT}`);
});

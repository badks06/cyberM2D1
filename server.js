
// Importer les modules nécessaires
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();  // Base de données SQLite
const csurf = require('csurf'); // Middleware CSRF
const cookieParser = require('cookie-parser'); // Pour les cookies
const fs = require('fs');
const he = require('he');

// Créer une instance de l'application Express
const app = express();

// Définir le port d'écoute
const PORT = 3000;

// Middleware pour analyser les requêtes JSON
app.use(express.json());

/ Ajouter le middleware cookie-parser
app.use(cookieParser()); // Middleware pour analyser les cookies

// Ajouter le middleware CSRF
app.use(csurf({ cookie: true })); // Activer le middleware CSRF


// Créer une base de données en mémoire (vulnérabilité potentielle si elle était persistante)
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Erreur lors de la création de la base de données :', err.message);
    } else {
        console.log('Base de données SQLite créée avec succès dans un fichier.');
    }
});

// Créer une table pour stocker des utilisateurs (sans sécurisation des champs)
//db.serialize(() => {
 //   db.run("CREATE TABLE users (name TEXT, age INTEGER)");
//});

// Définir une route GET pour la page d'accueil
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur Express!');
});

// Définir une route GET pour une page "hello"
app.get('/hello', (req, res) => {
    res.send('Hello World!');
});

const uploadDir = path.join(__dirname, 'uploads');


// Vulnérabilité : Inclusion de fichier avec un chemin d'accès non sécurisé
app.get('/files/:filename', (req, res) => {
    console.log("/files/:filename")

    const filename = req.params.filename;
    const safeFilename = filename.replace(/(\.\.\/|\.\.|\/)/g, '');
    const filePath = path.join(uploadDir, safeFilename);

    
if (!filePath.startsWith(uploadDir)) {
        return res.status(403).send('Accès interdit');
    }


    // Envoyer le fichier
    res.sendFile(normalizedPath, (err) => {
        if (err) {
            res.status(404).send('Fichier non trouvé');
        }
    });
});

// Vulnérabilité : Injection SQL dans une requête non préparée
app.get('/user', (req, res) => {
    const userName = req.query.name;
    const query = `SELECT * FROM users WHERE name = ?`;  // Requête non préparée
    //`SELECT * FROM users WHERE name = 'Paul' OR '1' = '1'`; 
    
    db.all(query, [userName], (err, rows) => {
        if (err) {
            res.status(500).send('Erreur du serveur');
        } else if (rows.length > 0) {
            res.send(`Utilisateur trouvé : ${JSON.stringify(rows)}`);
        } else {
            res.send('Utilisateur non trouvé');
        }
    });
});

// Vulnérabilité : Absence de validation d'entrée sur les requêtes POST
app.post('/data', (req, res) => {
    const { name, age } = req.body;

if (typeof name !== 'string' || name.length === 0 || typeof age !== 'number') {
        return res.status(400).send('Données invalides');
    }
const query = `INSERT INTO users (name, age) VALUES (?, ?)`;
    db.run(query, [name, age], function(err) {
if (err) {
            res.status(500).send('Erreur lors de l\'insertion');
        } else {
  
    const safeName = he.encode(name);
            const safeAge = he.encode(age.toString());

            res.render('templateName', { name: he.encode(name), age: he.encode(age) });
}
});
});
// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});

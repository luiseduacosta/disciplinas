const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'filosofia.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Create Categories Table
        db.run(`CREATE TABLE IF NOT EXISTS categorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT
        )`);

        // Create Topics Table
        db.run(`CREATE TABLE IF NOT EXISTS topicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria_id INTEGER,
            questao TEXT NOT NULL,
            topico TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias (id)
        )`);

        // Create Tags Table
        db.run(`CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        )`);

        // Create Topic_Tags Table
        db.run(`CREATE TABLE IF NOT EXISTS topico_tags (
            topico_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (topico_id, tag_id),
            FOREIGN KEY (topico_id) REFERENCES topicos (id),
            FOREIGN KEY (tag_id) REFERENCES tags (id)
        )`);

        // Create Images Table
        db.run(`CREATE TABLE IF NOT EXISTS imagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topico_id INTEGER,
            caminho TEXT NOT NULL,
            descricao TEXT,
            ordem INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (topico_id) REFERENCES topicos (id)
        )`);

        // Seed Data if categories are empty
        db.get("SELECT count(*) as count FROM categorias", (err, row) => {
            if (row.count === 0) {
                console.log("Seeding data...");
                seedData();
            }
        });
    });
}

function seedData() {
    const categories = [
        { nome: 'Epistemicídio e transmodernidade', descricao: 'Filosofia antiga e idealismo.' },
        { nome: 'Pré-socráticos', descricao: 'Filosofia antiga e idealismo.' },
        { nome: 'Sócrates', descricao: 'Filosofia antiga e idealismo.' },
        { nome: 'Platão', descricao: 'Idealismo objetivo.' },
        { nome: 'Aristóteles', descricao: 'Práxis e poiese, potência e ato, escravidão natural.' },
        { nome: 'Cristianismo', descricao: 'Tomismo. Sacrifício.' },
        { nome: 'Modernidade', descricao: 'Razão e modernidade.' },
        { nome: 'Marxismo e teoria crítica', descricao: 'Marx, marxismos e teorias críticas.' },
        { nome: 'Nietzsche', descricao: 'Niilismo e modernidade.' }
    ];

    // Insert Categories
    const stmtCat = db.prepare("INSERT INTO categorias (nome, descricao) VALUES (?, ?)");
    categories.forEach(cat => {
        stmtCat.run(cat.nome, cat.descricao);
    });
    stmtCat.finalize();

    // Insert some tags
    const tags = ['Epistemicídio', 'Transmodernidade', 'Sueli Carneiro', 'Boaventura de Sousa Santos', 'Enrique Dussel', 'Martin Heidegger', 'Colonialidade', 'Modernidade', 'Escravidão', 'Práxis', 'Poiese', 'Niilismo'];
    const stmtTag = db.prepare("INSERT INTO tags (nome) VALUES (?)");
    tags.forEach(tag => {
        stmtTag.run(tag);
    });
    stmtTag.finalize(() => {
        // Insert Topics and link tags (Simplified for demo)
        // We need IDs, so normally we'd do this in callbacks, but for simple seeding we can assume IDs 1, 2, 3...

        // Topic for Epistemicídio e transmodernidade (Cat ID 1)
        db.run(`INSERT INTO topicos (categoria_id, questao, topico) VALUES (1, 'O que é o Mundo das Ideias?', 'A teoria de que a realidade não material é a mais fundamental.')`, function (err) {
            if (!err) {
                const topicId = this.lastID;
                db.run(`INSERT INTO topico_tags (topico_id, tag_id) VALUES (?, 3)`, [topicId]); // Metafísica (Tag ID 3 assuming order)
            }
        });

        // Topic for Pré-socráticos (Cat ID 2)
        db.run(`INSERT INTO topicos (categoria_id, questao, topico) VALUES (2, 'Qual a definição de virtude?', 'Virtude é o justo meio entre dois vícios.')`, function (err) {
            if (!err) {
                const topicId = this.lastID;
                db.run(`INSERT INTO topico_tags (topico_id, tag_id) VALUES (?, 1)`, [topicId]); // Ética
            }
        });

        // Topic for Sócrates (Cat ID 3)
        db.run(`INSERT INTO topicos (categoria_id, questao, topico) VALUES (3, 'O que é patriarcado?', 'Sistema social em que homens detêm o poder primário.')`, function (err) {
            if (!err) {
                const topicId = this.lastID;
                db.run(`INSERT INTO topico_tags (topico_id, tag_id) VALUES (?, 4)`, [topicId]); // Gênero
            }
        });

        // Topic for Platão (Cat ID 4)
        db.run(`INSERT INTO topicos (categoria_id, questao, topico) VALUES (4, 'O que é a mais-valia?', 'A diferença entre o valor produzido pelo trabalho e o salário pago.')`, function (err) {
            if (!err) {
                const topicId = this.lastID;
                db.run(`INSERT INTO topico_tags (topico_id, tag_id) VALUES (?, 5)`, [topicId]); // Economia
            }
        });
    });
}

module.exports = db;

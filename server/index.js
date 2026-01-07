const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes

// Get all categories
app.get('/api/categorias', (req, res) => {
    const sql = "SELECT * FROM categorias";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Get topics (filter by category_id optional)
app.get('/api/topicos', (req, res) => {
    let sql = "SELECT * FROM topicos";
    const params = [];

    if (req.query.categoria_id) {
        sql += " WHERE categoria_id = ?";
        params.push(req.query.categoria_id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Get single topic details with tags and images
app.get('/api/topicos/:id', (req, res) => {
    const sqlTopic = "SELECT * FROM topicos WHERE id = ?";
    const sqlTags = `
        SELECT t.id, t.nome FROM tags t
        JOIN topico_tags tt ON t.id = tt.tag_id
        WHERE tt.topico_id = ?
    `;
    const sqlImages = "SELECT * FROM imagens WHERE topico_id = ?";

    const topicId = req.params.id;

    db.get(sqlTopic, [topicId], (err, topic) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!topic) {
            res.status(404).json({ "error": "Topico not found" });
            return;
        }

        // Fetch Tags
        db.all(sqlTags, [topicId], (err, tags) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            topic.tags = tags; // Return full tag objects (id, name)

            // Fetch Images
            db.all(sqlImages, [topicId], (err, images) => {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                topic.images = images;

                res.json({
                    "message": "success",
                    "data": topic
                });
            });
        });
    });
});

// --- ADMIN ROUTES ---

// Create Category
app.post('/api/categorias', (req, res) => {
    const { nome, descricao } = req.body;
    const sql = "INSERT INTO categorias (nome, descricao) VALUES (?, ?)";
    const params = [nome, descricao];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, nome, descricao }
        });
    });
});

// Update Category
app.put('/api/categorias/:id', (req, res) => {
    const { nome, descricao } = req.body;
    const sql = "UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?";
    const params = [nome, descricao, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success" });
    });
});

// Delete Category
app.delete('/api/categorias/:id', (req, res) => {
    const sql = "DELETE FROM categorias WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Create Topic
app.post('/api/topicos', (req, res) => {
    const { categoria_id, questao, topico } = req.body;
    const sql = "INSERT INTO topicos (categoria_id, questao, topico) VALUES (?, ?, ?)";
    const params = [categoria_id, questao, topico];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, categoria_id, questao, topico }
        });
    });
});

// Update Topic
app.put('/api/topicos/:id', (req, res) => {
    const { categoria_id, questao, topico } = req.body;
    const sql = "UPDATE topicos SET categoria_id = ?, questao = ?, topico = ? WHERE id = ?";
    db.run(sql, [categoria_id, questao, topico, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success" });
    });
});

// Delete Topic
app.delete('/api/topicos/:id', (req, res) => {
    const sql = "DELETE FROM topicos WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Tags CRUD
app.get('/api/tags', (req, res) => {
    const sql = "SELECT * FROM tags ORDER BY nome ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post('/api/tags', (req, res) => {
    const { nome } = req.body;
    const sql = "INSERT INTO tags (nome) VALUES (?)";
    db.run(sql, [nome], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": { id: this.lastID, nome } });
    });
});

app.delete('/api/tags/:id', (req, res) => {
    const sql = "DELETE FROM tags WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Topic-Tag Relationships
app.post('/api/topicos/:id/tags', (req, res) => {
    const { tag_id } = req.body;
    const sql = "INSERT OR IGNORE INTO topico_tags (topico_id, tag_id) VALUES (?, ?)";
    db.run(sql, [req.params.id, tag_id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success" });
    });
});

app.delete('/api/topicos/:id/tags/:tag_id', (req, res) => {
    const sql = "DELETE OR IGNORE FROM topico_tags WHERE topico_id = ? AND tag_id = ?";
    db.run(sql, [req.params.id, req.params.tag_id], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

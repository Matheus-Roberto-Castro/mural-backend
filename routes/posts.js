const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin }= require('../middleware/auth');
const PDFDocument = require("pdfkit");

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, image, expires_at, links, files } = req.body;
    const author_id = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const result = await db.query(
      `INSERT INTO posts (title, description, image, author_id, expires_at, links, files)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, image, author_id, created_at, expires_at, is_active`,
      [
        title, 
        description, 
        image, 
        author_id, 
        expires_at || null, 
        JSON.stringify(links ||[]), 
        JSON.stringify(files ||[]) 
      ]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar postagem' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, image, expires_at, links, files } = req.body;

  try {
    const result = await db.query(
      `UPDATE posts
       SET title = $1, description = $2, image = $3, expires_at = $4, links = $5, files = $6
       WHERE id = $7
       RETURNING *`,
      [
        title, 
        description, 
        image, 
        expires_at || null, 
        JSON.stringify(links ||[]), 
        JSON.stringify(files ||[]), 
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Postagem não encontrada' });
    }

    res.json({ message: 'Postagem atualizada com sucesso', post: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar postagem' });
  }
});


router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Postagem não encontrada' });
    }

    res.json({ message: 'Postagem deletada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar postagem' });
  }
});


router.get('/', async (req, res) => {
  try {
    await db.query(
      `UPDATE posts
       SET is_active = false
       WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true`
    );

    const result = await db.query(
      `SELECT * FROM posts 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar postagens ativas' });
  }
});

router.get('/expired', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id,
        title,
        description,
        image,
        links,
        files,
        created_at,
        expires_at
      FROM posts 
      WHERE expires_at <= NOW() 
      ORDER BY expires_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar postagens expiradas' });
  }
});

router.get("/expired/export/pdf", authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, image, links, files, created_at, expires_at
      FROM posts
      WHERE expires_at <= NOW()
      ORDER BY expires_at DESC
    `);

    const posts = result.rows;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=historico.pdf");
    doc.pipe(res);

    doc.fontSize(22).text("Histórico de Postagens Expiradas", { align: "center" });
    doc.moveDown(2);

    posts.forEach((p) => {
      doc.fontSize(16).text(p.title, { underline: true });

      doc.fontSize(12).text(`Descrição: ${p.description}`);
      
      doc.fontSize(12).text(`Criado em: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
      doc.text(`Expirou em: ${p.expires_at}`);

      if (p.links?.length) doc.text(`Links: ${p.links.join(", ")}`);

      if (p.files?.length) {
        doc.text("Arquivos:");
        p.files.forEach(f => doc.text("- " + f.name));
      }
      doc.moveDown(1.5);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar PDF" });
  }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`SELECT * FROM posts WHERE id = $1`, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Postagem não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar postagem específica' });
    }
});

module.exports = router;

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const path = require("path");

const app = express();   // ✅ APP CREATED FIRST

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend")));


// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});


// HEALTH CHECK
app.get("/api/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});


// CREATE PASTE
app.post("/api/pastes", async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;

    const result = await pool.query(
      `INSERT INTO pastes (code, ttl, views, max_views)
       VALUES ($1, $2, 0, $3)
       RETURNING id`,
      [content, ttl_seconds || null, max_views || null]
    );

    res.json({ url: `/p/${result.rows[0].id}` });

  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// FETCH PASTE
app.get("/api/pastes/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *,
      (created_at + (ttl || ' seconds')::interval) AS expires_at
      FROM pastes
      WHERE id = $1
      `,
      [req.params.id]
    );

    const paste = rows[0];
    if (!paste) return res.status(404).json({ error: "Not found" });

    // ⏰ TTL check
    if (paste.ttl && new Date() > paste.expires_at) {
      return res.status(410).json({ error: "Paste expired" });
    }

    // 👀 Max views check
    if (paste.max_views && paste.views >= paste.max_views) {
      return res.status(403).json({ error: "View limit exceeded" });
    }

    // ✅ Increment views
    await pool.query(
      "UPDATE pastes SET views = views + 1 WHERE id=$1",
      [paste.id]
    );

    res.json({
      content: paste.code,
      remaining_views: paste.max_views
        ? paste.max_views - (paste.views + 1)
        : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch failed" });
  }
});



// VIEW PASTE
app.get("/p/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT *,
      (created_at + (ttl || ' seconds')::interval) AS expires_at
      FROM pastes
      WHERE id = $1
      `,
      [req.params.id]
    );

    const paste = rows[0];
    if (!paste) return res.status(404).send("Paste not found");

    // ⏰ TTL check
    if (paste.ttl && new Date() > paste.expires_at) {
      return res.status(410).send("Paste expired");
    }

    // 👀 Max views check
    if (paste.max_views && paste.views >= paste.max_views) {
      return res.status(403).send("View limit exceeded");
    }

    await pool.query(
      "UPDATE pastes SET views = views + 1 WHERE id=$1",
      [paste.id]
    );

    res.send(`<pre>${paste.code.replace(/</g, "&lt;")}</pre>`);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});


module.exports = app;   // ✅ REQUIRED FOR VERCEL

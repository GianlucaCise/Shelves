const express = require("express");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

function getFranchisesWithGames(){
  const franchises = db.prepare("SELECT id, name FROM franchises ORDER BY rowid").all();
  const gamesStmt = db.prepare("SELECT id, title, original_console, has_remaster, remaster_console FROM games WHERE franchise_id = ? ORDER BY rowid");

  return franchises.map(f => ({
    id: f.id,
    name: f.name,
    games: gamesStmt.all(f.id).map(g => ({
      id: g.id,
      title: g.title,
      originalConsole: g.original_console,
      hasRemaster: !!g.has_remaster,
      remasterConsole: g.remaster_console
    }))
  }));
}

// GET /api/franchises — elenco completo con i giochi annidati
router.get("/", (req, res) => {
  res.json(getFranchisesWithGames());
});

// POST /api/franchises — crea un nuovo franchise { name }
router.post("/", (req, res) => {
  const name = (req.body.name || "").trim();
  if(!name) return res.status(400).json({ error: "Il nome del franchise è obbligatorio" });

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO franchises (id, name) VALUES (?, ?)").run(id, name);
  res.status(201).json({ id, name, games: [] });
});

// DELETE /api/franchises/:id — elimina un franchise e i suoi giochi (cascade)
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM franchises WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// POST /api/franchises/:id/games — aggiunge un gioco al franchise
router.post("/:id/games", (req, res) => {
  const franchise = db.prepare("SELECT id FROM franchises WHERE id = ?").get(req.params.id);
  if(!franchise) return res.status(404).json({ error: "Franchise non trovato" });

  const title = (req.body.title || "").trim();
  const originalConsole = (req.body.originalConsole || "").trim();
  if(!title || !originalConsole){
    return res.status(400).json({ error: "Titolo e console originale sono obbligatori" });
  }

  const hasRemaster = !!req.body.hasRemaster && !!(req.body.remasterConsole || "").trim();
  const remasterConsole = hasRemaster ? req.body.remasterConsole.trim() : "";

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO games (id, franchise_id, title, original_console, has_remaster, remaster_console)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, franchise.id, title, originalConsole, hasRemaster ? 1 : 0, remasterConsole);

  res.status(201).json({ id, title, originalConsole, hasRemaster, remasterConsole });
});

// DELETE /api/franchises/games/:gameId — rimuove un singolo gioco
router.delete("/games/:gameId", (req, res) => {
  db.prepare("DELETE FROM games WHERE id = ?").run(req.params.gameId);
  res.status(204).end();
});

module.exports = { router, getFranchisesWithGames };

const express = require("express");
const crypto = require("crypto");
const db = require("../db");

const router = express.Router();

function getConsolesWithEmulators(){
  const consoles = db.prepare("SELECT id, name FROM consoles ORDER BY rowid").all();
  const emulatorsStmt = db.prepare("SELECT id, name FROM emulators WHERE console_id = ? ORDER BY rowid");

  return consoles.map(c => ({
    id: c.id,
    console: c.name,
    emulators: emulatorsStmt.all(c.id).map(e => e.name),
    // manteniamo anche gli id, utili per la cancellazione puntuale lato futuro frontend
    emulatorIds: emulatorsStmt.all(c.id).map(e => e.id)
  }));
}

// GET /api/consoles — elenco completo con gli emulatori annidati
router.get("/", (req, res) => {
  res.json(getConsolesWithEmulators());
});

// POST /api/consoles — crea una nuova console { name }
router.post("/", (req, res) => {
  const name = (req.body.name || "").trim();
  if(!name) return res.status(400).json({ error: "Il nome della console è obbligatorio" });

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO consoles (id, name) VALUES (?, ?)").run(id, name);
  res.status(201).json({ id, console: name, emulators: [] });
});

// DELETE /api/consoles/:id — elimina una console e i suoi emulatori (cascade)
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM consoles WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

// POST /api/consoles/:id/emulators — aggiunge un emulatore alla console
router.post("/:id/emulators", (req, res) => {
  const consoleEntry = db.prepare("SELECT id FROM consoles WHERE id = ?").get(req.params.id);
  if(!consoleEntry) return res.status(404).json({ error: "Console non trovata" });

  const name = (req.body.name || "").trim();
  if(!name) return res.status(400).json({ error: "Il nome dell'emulatore è obbligatorio" });

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO emulators (id, console_id, name) VALUES (?, ?, ?)").run(id, consoleEntry.id, name);
  res.status(201).json({ id, name });
});

// DELETE /api/consoles/emulators/:emulatorId — rimuove un singolo emulatore
router.delete("/emulators/:emulatorId", (req, res) => {
  db.prepare("DELETE FROM emulators WHERE id = ?").run(req.params.emulatorId);
  res.status(204).end();
});

module.exports = { router, getConsolesWithEmulators };

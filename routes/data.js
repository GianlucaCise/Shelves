const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { getFranchisesWithGames } = require("./franchises");
const { getConsolesWithEmulators } = require("./consoles");

const router = express.Router();

// GET /api/data — snapshot completo (usato anche per "Esporta JSON")
router.get("/", (req, res) => {
  res.json({
    franchises: getFranchisesWithGames(),
    consoles: getConsolesWithEmulators()
  });
});

// POST /api/data — sostituisce tutti i dati (usato per "Importa JSON")
router.post("/", (req, res) => {
  const incoming = req.body;
  if(!incoming || !Array.isArray(incoming.franchises) || !Array.isArray(incoming.consoles)){
    return res.status(400).json({ error: "Formato non valido" });
  }

  const importAll = db.transaction((payload) => {
    db.prepare("DELETE FROM games").run();
    db.prepare("DELETE FROM franchises").run();
    db.prepare("DELETE FROM emulators").run();
    db.prepare("DELETE FROM consoles").run();

    const insertFranchise = db.prepare("INSERT INTO franchises (id, name) VALUES (?, ?)");
    const insertGame = db.prepare(`
      INSERT INTO games (id, franchise_id, title, original_console, has_remaster, remaster_console)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertConsole = db.prepare("INSERT INTO consoles (id, name) VALUES (?, ?)");
    const insertEmulator = db.prepare("INSERT INTO emulators (id, console_id, name) VALUES (?, ?, ?)");

    for(const franchise of payload.franchises){
      const franchiseId = crypto.randomUUID();
      insertFranchise.run(franchiseId, String(franchise.name || "").trim());
      for(const game of (franchise.games || [])){
        insertGame.run(
          crypto.randomUUID(),
          franchiseId,
          String(game.title || "").trim(),
          String(game.originalConsole || "").trim(),
          game.hasRemaster ? 1 : 0,
          String(game.remasterConsole || "")
        );
      }
    }

    for(const consoleEntry of payload.consoles){
      const consoleId = crypto.randomUUID();
      insertConsole.run(consoleId, String(consoleEntry.console || "").trim());
      for(const emulatorName of (consoleEntry.emulators || [])){
        insertEmulator.run(crypto.randomUUID(), consoleId, String(emulatorName || "").trim());
      }
    }
  });

  importAll(incoming);
  res.json({
    franchises: getFranchisesWithGames(),
    consoles: getConsolesWithEmulators()
  });
});

module.exports = router;

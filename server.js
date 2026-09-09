require("dotenv").config();

const path = require("path");
const express = require("express");

const { router: franchisesRouter } = require("./routes/franchises");
const { router: consolesRouter } = require("./routes/consoles");
const dataRouter = require("./routes/data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API
app.use("/api/franchises", franchisesRouter);
app.use("/api/consoles", consolesRouter);
app.use("/api/data", dataRouter);

// Frontend statico (la cartella public/ contiene le pagine e gli asset)
app.use(express.static(path.join(__dirname, "public")));

// Scorciatoia: apri la root e finisci sulla pagina Franchise
app.get("/", (req, res) => {
  res.redirect("/franchise/");
});

app.listen(PORT, () => {
  console.log(`Shelves in ascolto su http://localhost:${PORT}`);
});

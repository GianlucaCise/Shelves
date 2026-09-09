# Shelves — branch node

Backend Express + SQLite che sostituisce il localStorage della versione
vanilla (branch `main`). Il frontend (cartella `public/`) resta HTML/CSS/JS
puro, ma ora comunica con il server tramite le API invece di leggere/scrivere
direttamente nel browser.

## Configurazione

Copia `.env.example` in `.env` (già pronto con `PORT=3000`) e modifica pure
la porta se ti serve:

```
cp .env.example .env
```

## Avvio

```
npm install
npm start
```

Il server parte sulla porta indicata in `.env` (default `http://localhost:3000`,
redirige automaticamente a `/franchise/`). I dati vengono salvati in
`shelves.db` (SQLite), creato automaticamente al primo avvio nella cartella
del progetto.

## Struttura

```
server.js              avvio del server Express
db.js                   apertura del DB SQLite e creazione tabelle
routes/
  franchises.js         API franchise + giochi
  consoles.js            API console + emulatori
  data.js                 export/import completo (GET/POST /api/data)
public/
  common.js              logica condivisa lato client (fetch verso le API)
  franchise/              pagina Franchise
  emulatori/              pagina Emulatori
  style.css, fonts.css, fonts/   invariati rispetto al branch main
```

## API principali

- `GET  /api/data` — snapshot completo (usato anche per "Esporta JSON")
- `POST /api/data` — sostituisce tutti i dati (usato per "Importa JSON")
- `GET  /api/franchises` — elenco franchise con giochi annidati
- `POST /api/franchises` `{ name }`
- `DELETE /api/franchises/:id`
- `POST /api/franchises/:id/games` `{ title, originalConsole, hasRemaster, remasterConsole }`
- `DELETE /api/franchises/games/:gameId`
- `GET  /api/consoles` — elenco console con emulatori annidati
- `POST /api/consoles` `{ name }`
- `DELETE /api/consoles/:id`
- `POST /api/consoles/:id/emulators` `{ name }`
- `DELETE /api/consoles/emulators/:emulatorId`

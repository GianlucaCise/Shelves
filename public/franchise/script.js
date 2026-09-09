"use strict";

// Nota: data, dataReady, apiFetch(), escapeHtml() e setupExportImport()
// arrivano da ../common.js, caricato prima di questo file.

(function(){

  setupExportImport();

  // ---------- franchise form (top level) ----------

  const franchiseFormPanel = document.getElementById("franchise-form-panel");
  const franchiseNameInput = document.getElementById("franchise-name-input");

  document.getElementById("new-franchise-btn").addEventListener("click", () => {
    franchiseFormPanel.classList.add("open");
    franchiseNameInput.value = "";
    franchiseNameInput.focus();
  });

  document.getElementById("cancel-franchise-btn").addEventListener("click", () => {
    franchiseFormPanel.classList.remove("open");
  });

  document.getElementById("save-franchise-btn").addEventListener("click", async () => {
    const name = franchiseNameInput.value.trim();
    if(!name) return;
    try{
      const franchise = await apiFetch("/franchises", { method: "POST", body: JSON.stringify({ name }) });
      data.franchises.push(franchise);
      franchiseFormPanel.classList.remove("open");
      renderFranchises();
    }catch(e){
      alert("Errore nel salvare il franchise: " + e.message);
    }
  });

  // ---------- render: franchises ----------

  const franchisesList = document.getElementById("franchises-list");
  const franchisesEmpty = document.getElementById("franchises-empty");

  function renderFranchises(){
    franchisesList.innerHTML = "";
    franchisesEmpty.style.display = data.franchises.length ? "none" : "block";

    data.franchises.forEach(franchise => {
      const section = document.createElement("div");
      section.className = "franchise";

      section.innerHTML = `
        <div class="franchise-head">
          <h3>${escapeHtml(franchise.name)}<span class="count">${franchise.games.length} ${franchise.games.length === 1 ? "gioco" : "giochi"}</span></h3>
          <div class="franchise-actions">
            <button class="icon-btn add-game-btn">+ Gioco</button>
            <button class="icon-btn danger remove-franchise-btn">Elimina</button>
          </div>
        </div>
        <div class="form-panel game-form-panel">
          <div class="form-grid">
            <div class="form-field full">
              <label>Titolo del gioco</label>
              <input type="text" class="game-title-input" placeholder="Es. Ocarina of Time">
            </div>
            <div class="form-field">
              <label>Console originale</label>
              <input type="text" class="game-console-input" list="console-list" placeholder="Es. Nintendo 64">
            </div>
            <div class="form-field">
              <label>&nbsp;</label>
              <div class="checkbox-row">
                <input type="checkbox" class="game-remaster-check" id="remaster-check-${franchise.id}">
                <label for="remaster-check-${franchise.id}">Esiste una remaster/remake</label>
              </div>
            </div>
            <div class="form-field full remaster-console-field" style="display:none">
              <label>Console della remaster/remake</label>
              <input type="text" class="game-remaster-console-input" list="console-list" placeholder="Es. Nintendo Switch">
            </div>
          </div>
          <div class="form-buttons">
            <button class="primary-btn save-game-btn">Salva gioco</button>
            <button class="subtle-btn cancel-game-btn">Annulla</button>
          </div>
        </div>
        <div class="games-grid"></div>
      `;

      const gamesGrid = section.querySelector(".games-grid");
      if(franchise.games.length === 0){
        gamesGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:24px;">Nessun gioco in questo franchise ancora.</div>`;
      }else{
        franchise.games.forEach(game => {
          gamesGrid.appendChild(renderGameCard(franchise, game));
        });
      }

      // franchise-level actions
      section.querySelector(".remove-franchise-btn").addEventListener("click", async () => {
        const ok = confirm(`Eliminare il franchise "${franchise.name}" e tutti i suoi giochi?`);
        if(!ok) return;
        try{
          await apiFetch(`/franchises/${franchise.id}`, { method: "DELETE" });
          data.franchises = data.franchises.filter(f => f.id !== franchise.id);
          renderFranchises();
        }catch(e){
          alert("Errore nell'eliminare il franchise: " + e.message);
        }
      });

      const gameFormPanel = section.querySelector(".game-form-panel");
      const titleInput = section.querySelector(".game-title-input");
      const consoleInput = section.querySelector(".game-console-input");
      const remasterCheck = section.querySelector(".game-remaster-check");
      const remasterField = section.querySelector(".remaster-console-field");
      const remasterConsoleInput = section.querySelector(".game-remaster-console-input");

      section.querySelector(".add-game-btn").addEventListener("click", () => {
        gameFormPanel.classList.add("open");
        titleInput.value = "";
        consoleInput.value = "";
        remasterCheck.checked = false;
        remasterField.style.display = "none";
        remasterConsoleInput.value = "";
        titleInput.focus();
      });

      section.querySelector(".cancel-game-btn").addEventListener("click", () => {
        gameFormPanel.classList.remove("open");
      });

      remasterCheck.addEventListener("change", () => {
        remasterField.style.display = remasterCheck.checked ? "block" : "none";
      });

      section.querySelector(".save-game-btn").addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const originalConsole = consoleInput.value.trim();
        if(!title || !originalConsole) return;
        const hasRemaster = remasterCheck.checked;
        const remasterConsole = hasRemaster ? remasterConsoleInput.value.trim() : "";

        try{
          const game = await apiFetch(`/franchises/${franchise.id}/games`, {
            method: "POST",
            body: JSON.stringify({ title, originalConsole, hasRemaster, remasterConsole })
          });
          franchise.games.push(game);
          gameFormPanel.classList.remove("open");
          renderFranchises();
        }catch(e){
          alert("Errore nel salvare il gioco: " + e.message);
        }
      });

      franchisesList.appendChild(section);
    });
  }

  function renderGameCard(franchise, game){
    const card = document.createElement("div");
    card.className = "cartridge" + (game.hasRemaster ? " has-remaster" : "");
    card.innerHTML = `
      <button class="remove-game" title="Rimuovi gioco">×</button>
      <h4>${escapeHtml(game.title)}</h4>
      <div class="badges">
        <div class="badge-row">
          <span class="badge-label">Originale</span>
          <span class="badge">${escapeHtml(game.originalConsole)}</span>
        </div>
        ${game.hasRemaster ? `
        <div class="badge-row">
          <span class="badge-label">Remaster</span>
          <span class="badge remaster">${escapeHtml(game.remasterConsole)}</span>
        </div>` : ""}
      </div>
    `;
    card.querySelector(".remove-game").addEventListener("click", async () => {
      try{
        await apiFetch(`/franchises/games/${game.id}`, { method: "DELETE" });
        franchise.games = franchise.games.filter(g => g.id !== game.id);
        renderFranchises();
      }catch(e){
        alert("Errore nel rimuovere il gioco: " + e.message);
      }
    });
    return card;
  }

  // permette a common.js di aggiornare questa vista dopo un import JSON
  window.onDataImported = renderFranchises;

  dataReady.then(renderFranchises);
})();

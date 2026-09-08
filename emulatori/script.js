"use strict";

// Nota: STORAGE_KEY, data, uid(), load(), save(), escapeHtml() e setupExportImport()
// arrivano da ../common.js, caricato prima di questo file.

(function(){

  setupExportImport();

  // ---------- console form (top level) ----------

  const consoleFormPanel = document.getElementById("console-form-panel");
  const consoleNameInput = document.getElementById("console-name-input");

  document.getElementById("new-console-btn").addEventListener("click", () => {
    consoleFormPanel.classList.add("open");
    consoleNameInput.value = "";
    consoleNameInput.focus();
  });

  document.getElementById("cancel-console-btn").addEventListener("click", () => {
    consoleFormPanel.classList.remove("open");
  });

  document.getElementById("save-console-btn").addEventListener("click", () => {
    const name = consoleNameInput.value.trim();
    if(!name) return;
    data.consoles.push({ id: uid(), console: name, emulators: [] });
    save();
    consoleFormPanel.classList.remove("open");
    renderConsoles();
  });

  // ---------- render: consoles / emulators ----------

  const consolesList = document.getElementById("consoles-list");
  const consolesEmpty = document.getElementById("consoles-empty");

  function renderConsoles(){
    consolesList.innerHTML = "";
    consolesEmpty.style.display = data.consoles.length ? "none" : "block";

    data.consoles.forEach(entry => {
      const card = document.createElement("div");
      card.className = "console-card";
      card.innerHTML = `
        <div class="console-card-head">
          <h3>${escapeHtml(entry.console)}</h3>
          <button class="icon-btn danger remove-console-btn">Elimina console</button>
        </div>
        <div class="emulator-tags"></div>
        <div class="inline-add">
          <input type="text" class="new-emulator-input" placeholder="Nome emulatore, es. Dolphin">
          <button class="icon-btn add-emulator-btn">+ Aggiungi</button>
        </div>
      `;

      const tagsWrap = card.querySelector(".emulator-tags");
      if(entry.emulators.length === 0){
        tagsWrap.innerHTML = `<span class="mono" style="color:var(--text-muted);font-size:13px;">Nessun emulatore assegnato</span>`;
      }else{
        entry.emulators.forEach((name, idx) => {
          const tag = document.createElement("span");
          tag.className = "emulator-tag";
          tag.innerHTML = `${escapeHtml(name)} <button title="Rimuovi">×</button>`;
          tag.querySelector("button").addEventListener("click", () => {
            entry.emulators.splice(idx, 1);
            save();
            renderConsoles();
          });
          tagsWrap.appendChild(tag);
        });
      }

      card.querySelector(".remove-console-btn").addEventListener("click", () => {
        const ok = confirm(`Eliminare la console "${entry.console}" e i suoi emulatori assegnati?`);
        if(!ok) return;
        data.consoles = data.consoles.filter(c => c.id !== entry.id);
        save();
        renderConsoles();
      });

      const newEmulatorInput = card.querySelector(".new-emulator-input");
      function addEmulator(){
        const name = newEmulatorInput.value.trim();
        if(!name) return;
        entry.emulators.push(name);
        save();
        renderConsoles();
      }
      card.querySelector(".add-emulator-btn").addEventListener("click", addEmulator);
      newEmulatorInput.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
          e.preventDefault();
          addEmulator();
        }
      });

      consolesList.appendChild(card);
    });
  }

  // permette a common.js di aggiornare questa vista dopo un import JSON
  window.onDataImported = renderConsoles;

  renderConsoles();
})();

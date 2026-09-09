"use strict";

// ---------- dati condivisi tra le pagine ----------
// A differenza della versione "vanilla" (main), qui i dati non stanno più in
// localStorage: vivono nel database SQLite del backend Express, e questo file
// parla con le API (/api/...) per leggerli e scriverli.

const API_BASE = "/api";

/** @typedef {{id:string,title:string,originalConsole:string,hasRemaster:boolean,remasterConsole:string}} Game */
/** @typedef {{id:string,name:string,games:Game[]}} Franchise */
/** @typedef {{id:string,console:string,emulators:string[],emulatorIds:string[]}} ConsoleEntry */

let data = {
  franchises: [],
  consoles: []
};

// Promise che si risolve quando il primo caricamento dal server è completo.
// Le pagine aspettano questa promise prima del primo render.
let dataReadyResolve;
const dataReady = new Promise(resolve => { dataReadyResolve = resolve; });

async function apiFetch(url, options){
  const res = await fetch(API_BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if(!res.ok){
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Richiesta fallita (${res.status})`);
  }
  if(res.status === 204) return null;
  return res.json();
}

async function loadData(){
  try{
    data = await apiFetch("/data");
  }catch(e){
    console.error("Impossibile caricare i dati dal server:", e);
    alert("Non riesco a contattare il server. Controlla che sia avviato (npm start).");
  }
  dataReadyResolve();
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- export / import (sidebar, presente in ogni pagina) ----------

function setupExportImport(){
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importInput = document.getElementById("import-file");

  if(exportBtn){
    exportBtn.addEventListener("click", async () => {
      const snapshot = await apiFetch("/data");
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0,10);
      a.href = url;
      a.download = `shelves-nintendo-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if(importBtn && importInput){
    importBtn.addEventListener("click", () => importInput.click());

    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try{
          const parsed = JSON.parse(reader.result);
          if(!parsed || !Array.isArray(parsed.franchises) || !Array.isArray(parsed.consoles)){
            throw new Error("Formato non valido");
          }
          const ok = confirm("Importare questo file sovrascriverà tutti i dati attuali sul server. Continuare?");
          if(!ok) return;
          data = await apiFetch("/data", { method: "POST", body: JSON.stringify(parsed) });
          if(typeof window.onDataImported === "function"){
            window.onDataImported();
          }
        }catch(err){
          alert("Il file selezionato non è un export valido di Shelves.");
        }
        importInput.value = "";
      };
      reader.readAsText(file);
    });
  }
}

// avvia subito il caricamento dei dati dal server
loadData();

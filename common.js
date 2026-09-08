"use strict";

// ---------- dati condivisi tra le pagine ----------

const STORAGE_KEY = "shelves-nintendo-tracker:v1";

/** @typedef {{id:string,title:string,originalConsole:string,hasRemaster:boolean,remasterConsole:string}} Game */
/** @typedef {{id:string,name:string,games:Game[]}} Franchise */
/** @typedef {{id:string,console:string,emulators:string[]}} ConsoleEntry */

let data = {
  franchises: [],
  consoles: []
};

function uid(){
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now();
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && Array.isArray(parsed.franchises) && Array.isArray(parsed.consoles)){
        data = parsed;
      }
    }
  }catch(e){
    console.warn("Impossibile leggere i dati salvati:", e);
  }
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- export / import (usati dalla sidebar, presente in ogni pagina) ----------

function setupExportImport(){
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importInput = document.getElementById("import-file");

  if(exportBtn){
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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
      reader.onload = () => {
        try{
          const parsed = JSON.parse(reader.result);
          if(!parsed || !Array.isArray(parsed.franchises) || !Array.isArray(parsed.consoles)){
            throw new Error("Formato non valido");
          }
          const ok = confirm("Importare questo file sovrascriverà tutti i dati attuali. Continuare?");
          if(!ok) return;
          data = parsed;
          save();
          // ogni pagina definisce la propria funzione di refresh, se presente
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

// caricamento dati non appena questo script viene eseguito, prima dello script di pagina
load();

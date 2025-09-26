// ================== SUPABASE ==================
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Usa tus credenciales actuales
const SUPABASE_URL = "https://usgcfgbmgiopwrjkcwts.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ2NmZ2JtZ2lvcHdyamtjd3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODQ5NjYsImV4cCI6MjA3NDI2MDk2Nn0.ErJpD7bUdWgPNGFTi0ZD1_WoQojcUeVXsexUq9Ij8eM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ================== HELPERS ==================
const $ = (s, c = document) => c.querySelector(s);

// "unidad1_sem3" -> {u:1,s:3}
const parseSemana = (tag) => {
  const m = /unidad(\d+)_sem(\d+)/i.exec(tag || "");
  return m ? { u: +m[1], s: +m[2] } : null;
};

// Sanea nombres para Storage (sin tildes/espacios raros)
function sanitizeName(filename) {
  const idx = filename.lastIndexOf(".");
  const base = idx >= 0 ? filename.slice(0, idx) : filename;
  const ext = idx >= 0 ? filename.slice(idx) : "";
  const cleanBase = base
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // quita tildes
    .replace(/[^a-zA-Z0-9._-]/g, "_")                  // solo seguros
    .replace(/_+/g, "_")                               // colapsa "__"
    .replace(/^_+|_+$/g, "");                          // trim "_"
  return (cleanBase || "archivo") + ext.toLowerCase();
}

// ================== AUTH UI ==================
const wrapper = $(".wrapper");
const btnPopup = $(".btnlogin-popup");
const iconClose = $(".icon-close");

btnPopup?.addEventListener("click", () => wrapper.classList.add("active-popup"));
iconClose?.addEventListener("click", () => wrapper.classList.remove("active-popup"));

$("#loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const [emailEl, passEl] = e.target.querySelectorAll("input");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailEl.value,
    password: passEl.value,
  });
  if (error) return Swal.fire("Error", error.message, "error");

  Swal.fire("Bienvenido", `Has iniciado sesión como ${data.user.email}`, "success");

  btnPopup.style.display = "none";
  const nav = document.querySelector("header nav");
  if (!document.querySelector(".welcome-msg")) {
    const welcome = document.createElement("span");
    welcome.className = "welcome-msg";
    welcome.innerHTML = `Bienvenido, <b>${data.user.email}</b>`;
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "logout-btn";
    logoutBtn.textContent = "Cerrar sesión";
    logoutBtn.onclick = logout;
    nav.append(welcome, logoutBtn);
  }
  wrapper.classList.remove("active-popup");
  await cargarTodo(); // recarga como admin
});

async function logout() {
  await supabase.auth.signOut();
  Swal.fire("Sesión cerrada", "", "info");
  btnPopup.style.display = "inline-block";
  document.querySelector(".welcome-msg")?.remove();
  document.querySelector(".logout-btn")?.remove();
  await cargarTodo(); // recarga como cliente
}

// ================== STORAGE + DB ==================
async function subirArchivo(file, semana) {
  try {
    // (Opcional) limitar tipos permitidos
    // const allowed = ["application/pdf","image/png","image/jpeg","image/webp",
    //   "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    //   "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   "application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    // if (file.type && !allowed.includes(file.type)) {
    //   return Swal.fire("Tipo no permitido", `No se admite: ${file.type}`, "warning");
    // }

    const safeName = sanitizeName(file.name);
    const path = `${semana}/${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("base_datos")
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
      });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("base_datos").getPublicUrl(path);

    // Guarda nombre saneado para que Eliminar funcione exacto
    const { error: insErr } = await supabase
      .from("archivos")
      .insert([{ nombre: safeName, semana, url: pub.publicUrl }]);
    if (insErr) throw insErr;

    Swal.fire("Éxito", "Archivo subido correctamente", "success");
    await cargarTodo();
  } catch (e) {
    Swal.fire("Error", e.message, "error");
  }
}

async function eliminarArchivo(nombre, semana) {
  const path = `${semana}/${nombre}`;
  await supabase.storage.from("base_datos").remove([path]);
  await supabase.from("archivos").delete().eq("nombre", nombre).eq("semana", semana);
  Swal.fire("Eliminado", "Archivo borrado correctamente", "success");
  await cargarTodo();
}

// ================== TARJETAS ==================
function tarjetaArchivo(a, isAdmin) {
  const card = document.createElement("div");
  card.className = "semana-card hover-glow";
  card.innerHTML = `
    <h4>${a.nombre}</h4>
    <div class="acciones">
      <a class="btn" href="${a.url}" target="_blank">Ver</a>
      <a class="btn" href="${a.url}" download>Descargar</a>
    </div>
  `;

  // 🔒 Controles SOLO para admin
  if (isAdmin) {
    const admin = document.createElement("div");
    admin.className = "admin-actions";
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";

    const bUp = document.createElement("button");
    bUp.className = "btn";
    bUp.textContent = "Subir";
    bUp.onclick = () => input.click();

    input.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) subirArchivo(f, a.semana);
    });

    const bDel = document.createElement("button");
    bDel.className = "btn btn-danger";
    bDel.textContent = "Eliminar";
    bDel.onclick = () => eliminarArchivo(a.nombre, a.semana);

    admin.append(input, bUp, bDel);
    card.appendChild(admin);
  }
  return card;
}

function tarjetaEmpty() {
  const card = document.createElement("div");
  card.className = "semana-card card-empty";
  card.innerHTML = `<h4>No hay archivos aún</h4><p>Vuelve pronto.</p>`;
  return card;
}

// Uploader directo a la semana (🔒 solo admin)
function tarjetaUploader(semanaTag, displayLabel) {
  const box = document.createElement("div");
  box.className = "semana-card admin-uploader";
  box.innerHTML = `
    <h4>Subir a ${displayLabel}</h4>
    <div class="admin-actions">
      <input type="file" id="up-${semanaTag}" style="display:none" />
      <button class="btn" id="btn-${semanaTag}">Elegir archivo</button>
    </div>`;
  box.querySelector(`#btn-${semanaTag}`).onclick =
    () => box.querySelector(`#up-${semanaTag}`).click();
  box.querySelector(`#up-${semanaTag}`).addEventListener("change", (ev) => {
    const f = ev.target.files[0];
    if (f) subirArchivo(f, semanaTag);
  });
  return box;
}


// ================== RENDER: TEMAS (agrupado por semana) ==================
function renderTemas(archivos, isAdmin) {
  const cont = $("#gridTema");
  cont.innerHTML = "";

  if (!archivos.length) {
    cont.innerHTML = "<p>No hay archivos disponibles.</p>";
    return;
  }

  const bySemana = {};
  for (const a of archivos) (bySemana[a.semana] ??= []).push(a);

  Object.entries(bySemana)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([semana, lista]) => {
      const bloque = document.createElement("div");
      bloque.className = "semana-bloque";
      bloque.innerHTML = `<h3 class="semana-titulo">${semana
        .replace("_", " ")
        .toUpperCase()}</h3>`;

      const grid = document.createElement("div");
      grid.className = "semanas-grid";

      lista.forEach((a) => grid.appendChild(tarjetaArchivo(a, isAdmin)));

      // ❌ Ya NO mostramos uploader aquí (solo en acordeón)
      // if (isAdmin) grid.appendChild(tarjetaUploader(semana));

      bloque.appendChild(grid);
      cont.appendChild(bloque);
    });
}

// ================== RENDER: ACORDEÓN 4×4 (16 semanas) ==================
function renderAcordeon(archivos, isAdmin) {
  const root = document.querySelector("#accordionUnidades");
  root.innerHTML = "";

  // Mapa {unidad:{semana:[archivos]}}
  const mapa = {};
  for (const a of archivos) {
    const m = /unidad(\d+)_sem(\d+)/i.exec(a.semana || "");
    if (!m) continue;
    const u = +m[1], s = +m[2];
    (mapa[u] ??= {})[s] ??= [];
    mapa[u][s].push(a);
  }

  for (let u = 1; u <= 4; u++) {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const head = document.createElement("button");
    head.className = "accordion-header";
    head.innerHTML = `Unidad ${u}<i class="chev bx bx-chevron-down text-2xl"></i>`;
    head.onclick = () => item.classList.toggle("open");

    const body = document.createElement("div");
    body.className = "accordion-body";

    for (let s = 1; s <= 4; s++) {
      const semanaTag = `unidad${u}_sem${s}`;
      const display = labelSemana(u, s);   // <-- Semana 01..16

      const block = document.createElement("div");
      block.className = "semana-bloque";
      block.innerHTML = `<h4 class="semana-titulo">${display}</h4>`;

      const grid = document.createElement("div");
      grid.className = "semanas-grid";

      const lista = (mapa[u]?.[s]) || [];

      if (lista.length > 0) {
        lista.forEach(a => grid.appendChild(tarjetaArchivo(a, isAdmin)));
        if (isAdmin) grid.appendChild(tarjetaUploader(semanaTag, display));
        if ((lista.length + (isAdmin ? 1 : 0)) === 1) grid.classList.add("single");
      } else {
        if (isAdmin) {
          grid.appendChild(tarjetaUploader(semanaTag, display));
        } else {
          grid.appendChild(tarjetaEmpty());
        }
        grid.classList.add("single");
      }

      block.appendChild(grid);
      body.appendChild(block);
    }

    item.append(head, body);
    root.appendChild(item);
  }
}

// Semana global (1..16) a partir de unidad u (1..4) y semana s (1..4)
const globalWeek = (u, s) => (u - 1) * 4 + s;
const labelSemana = (u, s) => `Semana ${String(globalWeek(u, s)).padStart(2, "0")}`;


// ================== CARGA GENERAL ==================
async function cargarTodo() {
  const { data: ses } = await supabase.auth.getSession();
  const isAdmin = !!ses.session;
  if (!isAdmin) document.querySelector(".btnlogin-popup").style.display = "inline-block";

  const { data: archivos, error } = await supabase.from("archivos").select("*");
  if (error) {
    console.error("Error cargando archivos:", error);
    return;
  }

  // Solo el acordeón (16 semanas). Ya no llamamos a renderTemas(...)
  renderAcordeon(archivos || [], isAdmin);
}

window.addEventListener("DOMContentLoaded", cargarTodo);

const KEY = "miOrganizadorV1";
const HOY_KEY = "miOrganizadorDia";

let datos = JSON.parse(localStorage.getItem(KEY)) || {
  xp: 0,
  tareas: [],
  proyectos: []
};

let filtro = "todas";

function guardar() {
  localStorage.setItem(KEY, JSON.stringify(datos));
}

function fechaLocal() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function limpiarTareasDeHoy() {
  const ultimoDia = localStorage.getItem(HOY_KEY);
  const hoy = fechaLocal();

  if (ultimoDia !== hoy) {
    datos.tareas = datos.tareas.filter(t => !t.esHoy);
    localStorage.setItem(HOY_KEY, hoy);
    guardar();
  }
}

function escapeHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function puntosTarea(tarea) {
  return tarea.puntos || 10;
}

function completarTarea(id) {
  const tarea = datos.tareas.find(t => t.id === id);
  if (!tarea) return;

  if (!tarea.hecha) {
    tarea.hecha = true;
    datos.xp += puntosTarea(tarea);
  } else {
    tarea.hecha = false;
    datos.xp = Math.max(0, datos.xp - puntosTarea(tarea));
  }

  guardar();
  render();
}

function borrarTarea(id) {
  if (!confirm("¿Borrar esta tarea?")) return;
  datos.tareas = datos.tareas.filter(t => t.id !== id);
  guardar();
  render();
}

function abrirModalTarea(esHoy) {
  document.getElementById("modalBody").innerHTML = `
    <h2>${esHoy ? "📅 Nueva tarea de hoy" : "📋 Nueva tarea"}</h2>
    <div class="form-group">
      <label>Tarea</label>
      <input id="tareaNombre" placeholder="Ej. Terminar el ejercicio de C#">
    </div>
    <div class="form-group">
      <label>Fecha (opcional)</label>
      <input id="tareaFecha" type="date" ${esHoy ? `value="${fechaLocal()}" disabled` : ""}>
    </div>
    <div class="form-group">
      <label>XP al completarla</label>
      <select id="tareaXP">
        <option value="5">5 XP — pequeña</option>
        <option value="10" selected>10 XP — normal</option>
        <option value="20">20 XP — importante</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="icon-btn" onclick="cerrarModal()">Cancelar</button>
      <button class="primary" onclick="crearTarea(${esHoy})">Crear tarea</button>
    </div>
  `;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("tareaNombre").focus();
}

function crearTarea(esHoy) {
  const nombre = document.getElementById("tareaNombre").value.trim();
  if (!nombre) return alert("Escribe un nombre para la tarea.");

  datos.tareas.push({
    id: Date.now(),
    nombre,
    fecha: esHoy ? fechaLocal() : document.getElementById("tareaFecha").value,
    esHoy,
    hecha: false,
    puntos: Number(document.getElementById("tareaXP").value),
    creada: Date.now()
  });

  guardar();
  cerrarModal();
  render();
}

function abrirModalProyecto() {
  document.getElementById("modalBody").innerHTML = `
    <h2>📁 Nuevo proyecto</h2>
    <div class="form-group">
      <label>Nombre</label>
      <input id="proyectoNombre" placeholder="Ej. Mi videojuego">
    </div>
    <div class="form-group">
      <label>Descripción (opcional)</label>
      <textarea id="proyectoDescripcion" placeholder="¿Qué quieres conseguir con este proyecto?"></textarea>
    </div>
    <div class="form-actions">
      <button class="icon-btn" onclick="cerrarModal()">Cancelar</button>
      <button class="primary" onclick="crearProyecto()">Crear proyecto</button>
    </div>
  `;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("proyectoNombre").focus();
}

function crearProyecto() {
  const nombre = document.getElementById("proyectoNombre").value.trim();
  if (!nombre) return alert("Escribe un nombre para el proyecto.");

  datos.proyectos.push({
    id: Date.now(),
    nombre,
    descripcion: document.getElementById("proyectoDescripcion").value.trim(),
    terminado: false,
    subtareas: []
  });

  guardar();
  cerrarModal();
  render();
}

function agregarSubtarea(proyectoId) {
  const nombre = prompt("¿Qué paso quieres añadir?");
  if (!nombre || !nombre.trim()) return;

  const proyecto = datos.proyectos.find(p => p.id === proyectoId);
  proyecto.subtareas.push({
    id: Date.now(),
    nombre: nombre.trim(),
    hecha: false
  });

  guardar();
  render();
}

function completarSubtarea(proyectoId, subId) {
  const proyecto = datos.proyectos.find(p => p.id === proyectoId);
  const sub = proyecto.subtareas.find(s => s.id === subId);

  if (!sub.hecha) {
    sub.hecha = true;
    datos.xp += 5;
  } else {
    sub.hecha = false;
    datos.xp = Math.max(0, datos.xp - 5);
  }

  const todas = proyecto.subtareas.length > 0 &&
    proyecto.subtareas.every(s => s.hecha);

  if (todas && !proyecto.terminado) {
    proyecto.terminado = true;
    datos.xp += 50;
    alert("🎉 ¡Proyecto terminado! +50 XP");
  } else if (!todas) {
    proyecto.terminado = false;
  }

  guardar();
  render();
}

function borrarProyecto(id) {
  if (!confirm("¿Borrar este proyecto y sus subtareas?")) return;
  datos.proyectos = datos.proyectos.filter(p => p.id !== id);
  guardar();
  render();
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
}

function cambiarSeccion(nombre) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(nombre).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.section === nombre);
  });
}

function renderTareas(hoySolo = false) {
  let tareas = datos.tareas.filter(t => hoySolo ? t.esHoy : !t.esHoy);

  if (!hoySolo) {
    if (filtro === "pendientes") tareas = tareas.filter(t => !t.hecha);
    if (filtro === "hechas") tareas = tareas.filter(t => t.hecha);
  }

  const contenedor = document.getElementById(hoySolo ? "listaHoy" : "listaTareas");

  if (!tareas.length) {
    contenedor.innerHTML = `<div class="empty">${hoySolo ? "No tienes tareas para hoy. ¡Añade alguna!" : "No hay tareas aquí todavía."}</div>`;
    return;
  }

  contenedor.innerHTML = tareas.map(t => `
    <div class="task ${t.hecha ? "done" : ""}">
      <div class="task-row">
        <input class="check" type="checkbox" ${t.hecha ? "checked" : ""}
          onchange="completarTarea(${t.id})">
        <div class="task-main">
          <div class="task-title">${escapeHTML(t.nombre)}</div>
          <div class="meta">
            ${t.esHoy ? "📅 Hoy" : (t.fecha ? "📆 " + t.fecha : "📌 Sin fecha")}
            · ⭐ ${t.puntos} XP
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn delete" onclick="borrarTarea(${t.id})">🗑️</button>
        </div>
      </div>
    </div>
  `).join("");
}

function renderProyectos() {
  const contenedor = document.getElementById("listaProyectos");

  if (!datos.proyectos.length) {
    contenedor.innerHTML = `<div class="empty">Todavía no tienes proyectos. Crea el primero y divídelo en pasos.</div>`;
    return;
  }

  contenedor.innerHTML = datos.proyectos.map(p => {
    const total = p.subtareas.length;
    const hechas = p.subtareas.filter(s => s.hecha).length;
    const porcentaje = total ? Math.round(hechas / total * 100) : 0;

    return `
      <div class="project">
        <div class="project-header">
          <div>
            <div class="project-title">${escapeHTML(p.nombre)} ${p.terminado ? "🎉" : ""}</div>
            ${p.descripcion ? `<div class="project-description">${escapeHTML(p.descripcion)}</div>` : ""}
          </div>
          <button class="icon-btn delete" onclick="borrarProyecto(${p.id})">🗑️</button>
        </div>

        <div class="project-progress">
          <div class="meta">${hechas}/${total} pasos · ${porcentaje}%</div>
          <div class="progress"><div style="width:${porcentaje}%"></div></div>
        </div>

        ${p.subtareas.map(s => `
          <label class="subtask ${s.hecha ? "done" : ""}">
            <input type="checkbox" ${s.hecha ? "checked" : ""}
              onchange="completarSubtarea(${p.id}, ${s.id})">
            <span>${escapeHTML(s.nombre)}</span>
          </label>
        `).join("")}

        <button class="add-subtask" onclick="agregarSubtarea(${p.id})">+ Añadir paso</button>
      </div>
    `;
  }).join("");
}

function renderInicio() {
  const pendientes = datos.tareas.filter(t => !t.hecha).length;
  const activos = datos.proyectos.filter(p => !p.terminado).length;

  document.getElementById("xpInicio").textContent = datos.xp;
  document.getElementById("pendientesInicio").textContent = pendientes;
  document.getElementById("proyectosInicio").textContent = activos;
  document.getElementById("puntos").textContent = `${datos.xp} XP`;

  const nivel = Math.floor(datos.xp / 100) + 1;
  const xpNivel = datos.xp % 100;
  document.getElementById("nivel").textContent = `Nivel ${nivel}`;
  document.getElementById("barraXP").style.width = `${xpNivel}%`;
  document.getElementById("textoXP").textContent = `${xpNivel} / 100 XP para el nivel ${nivel + 1}`;

  const hoy = datos.tareas.filter(t => t.esHoy);
  const hechas = hoy.filter(t => t.hecha).length;

  document.getElementById("resumenHoy").innerHTML = hoy.length
    ? `<strong>${hechas}/${hoy.length}</strong> tareas completadas hoy`
    : `<span class="meta">No tienes tareas para hoy.</span>`;
}

function render() {
  limpiarTareasDeHoy();

  document.getElementById("fechaActual").textContent =
    new Date().toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long"
    });

  renderTareas(true);
  renderTareas(false);
  renderProyectos();
  renderInicio();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => cambiarSeccion(btn.dataset.section));
});

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtro = btn.dataset.filter;
    renderTareas(false);
  });
});

document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") cerrarModal();
});

render();

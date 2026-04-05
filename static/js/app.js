// ============================================================
// NutriSMAE — JavaScript Application
// ============================================================

// ---- STATE ----
let state = {
  paciente: null,
  tmb: 0,
  mantenimiento: 0,
  kcalObjetivo: 0,
  macros: { prot: 0, grasa: 0, cho: 0 },
  equivalentes: {},
  distribucion: {}
};

// ---- SMAE DATA ----
const SMAE = [
  { id: 'verdura',    nombre: 'Verdura',              cho: 4,  prot: 2, grasa: 0, kcal: 25  },
  { id: 'fruta',      nombre: 'Fruta',                cho: 15, prot: 0, grasa: 0, kcal: 60  },
  { id: 'cereal_sg',  nombre: 'Cereal s/grasa',       cho: 15, prot: 2, grasa: 0, kcal: 70  },
  { id: 'cereal_cg',  nombre: 'Cereal c/grasa',       cho: 15, prot: 2, grasa: 5, kcal: 115 },
  { id: 'legum',      nombre: 'Leguminosas',           cho: 20, prot: 8, grasa: 1, kcal: 120 },
  { id: 'aoa_mb',     nombre: 'AOA Muy Bajo',          cho: 0,  prot: 7, grasa: 1, kcal: 40  },
  { id: 'aoa_b',      nombre: 'AOA Bajo',              cho: 0,  prot: 7, grasa: 3, kcal: 55  },
  { id: 'aoa_m',      nombre: 'AOA Moderado',          cho: 0,  prot: 7, grasa: 5, kcal: 75  },
  { id: 'aoa_a',      nombre: 'AOA Alto',              cho: 0,  prot: 7, grasa: 8, kcal: 100 },
  { id: 'leche',      nombre: 'Leche descremada',      cho: 12, prot: 8, grasa: 0, kcal: 95  },
  { id: 'grasa_sp',   nombre: 'Grasa s/proteína',      cho: 0,  prot: 0, grasa: 5, kcal: 45  },
  { id: 'grasa_cp',   nombre: 'Grasa c/proteína',      cho: 3,  prot: 3, grasa: 5, kcal: 70  },
];

// ============================================================
// NAVIGATION
// ============================================================
const SECTION_TITLES = {
  pacientes: 'Pacientes',
  calculadora: 'Calorías & TMB — Mifflin-St Jeor',
  macros: 'Macronutrimentos',
  smae: 'Plan de Equivalentes SMAE',
  distribucion: 'Distribución por Tiempos de Comida',
  comparacion: 'Comparación Objetivo vs SMAE'
};

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`sec-${name}`).classList.add('active');
  document.querySelector(`[data-section="${name}"]`).classList.add('active');
  document.getElementById('section-title').textContent = SECTION_TITLES[name];

  if (name === 'calculadora') refreshCalculadora();
  if (name === 'macros') refreshMacros();
  if (name === 'smae') renderSMAE();
  if (name === 'distribucion') renderDistribucion();
  if (name === 'comparacion') renderComparacion();

  // Close sidebar on mobile
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.body.classList.toggle('light', !isDark);
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

(function initTheme() {
  const t = localStorage.getItem('theme') || 'light';
  document.body.classList.add(t);
  if (t === 'light') document.body.classList.add('light');
  document.getElementById('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';
})();

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ============================================================
// FORM TOGGLE
// ============================================================
function toggleForm(id) {
  const el = document.getElementById(id);
  const visible = el.style.display !== 'none';
  el.style.display = visible ? 'none' : 'block';
}

// ============================================================
// PACIENTES
// ============================================================
async function cargarPacientes() {
  const res = await fetch('/api/pacientes');
  const list = await res.json();
  const grid = document.getElementById('patients-list');

  if (!list.length) {
    grid.innerHTML = `<div class="patient-required"><div class="empty-icon">👥</div><p>Sin pacientes registrados. Agrega tu primer paciente.</p></div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="patient-card ${state.paciente?.id === p.id ? 'selected' : ''}" onclick="seleccionarPaciente(${p.id})">
      <div class="patient-avatar">${p.nombre.charAt(0).toUpperCase()}</div>
      <div class="patient-name">${p.nombre}</div>
      <div class="patient-meta">
        <span>${p.peso} kg</span>
        <span>${p.estatura} cm</span>
        <span>${p.edad} años</span>
        <span>${p.sexo === 'M' ? '♂ Hombre' : '♀ Mujer'}</span>
      </div>
      <div class="patient-card-actions">
        <button class="icon-btn" onclick="event.stopPropagation(); eliminarPaciente(${p.id})" title="Eliminar">🗑</button>
      </div>
    </div>
  `).join('');
}

async function guardarPaciente() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const edad = +document.getElementById('p-edad').value;
  const peso = +document.getElementById('p-peso').value;
  const estatura = +document.getElementById('p-estatura').value;
  const sexo = document.getElementById('p-sexo').value;

  if (!nombre || !edad || !peso || !estatura || !sexo) {
    toast('Por favor completa todos los campos', 'error');
    return;
  }

  await fetch('/api/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, edad, peso, estatura, sexo })
  });

  // Clear form
  ['p-nombre','p-edad','p-peso','p-estatura'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('p-sexo').value = '';
  toggleForm('patient-form');
  toast(`Paciente "${nombre}" guardado`);
  cargarPacientes();
}

async function eliminarPaciente(id) {
  if (!confirm('¿Eliminar este paciente?')) return;
  await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
  if (state.paciente?.id === id) limpiarPaciente();
  toast('Paciente eliminado', 'error');
  cargarPacientes();
}

async function seleccionarPaciente(id) {
  const res = await fetch('/api/pacientes');
  const list = await res.json();
  state.paciente = list.find(p => p.id === id);

  // Update badge
  document.getElementById('patient-badge').style.display = 'flex';
  document.getElementById('badge-name').textContent = state.paciente.nombre;

  // Load plan if exists
  const planRes = await fetch(`/api/planes/${id}`);
  const plan = await planRes.json();
  if (plan) {
    state.kcalObjetivo = plan.kcal_objetivo;
    state.equivalentes = plan.equivalentes || {};
    // Set macro inputs
    document.getElementById('m-prot').value = plan.proteina_g_kg || 2.2;
    document.getElementById('m-grasa').value = plan.grasa_g_kg || 0.8;
    document.getElementById('m-kcal').value = Math.round(plan.kcal_objetivo);
  }

  cargarPacientes();
  toast(`Trabajando con ${state.paciente.nombre}`);
}

function limpiarPaciente() {
  state.paciente = null;
  document.getElementById('patient-badge').style.display = 'none';
}

// ============================================================
// CALCULADORA — MIFFLIN-ST JEOR
// ============================================================
function refreshCalculadora() {
  const p = state.paciente;
  const hasP = !!p;

  document.getElementById('calc-no-patient').style.display = hasP ? 'none' : 'flex';
  document.getElementById('calc-content').style.display = hasP ? 'block' : 'none';

  if (!hasP) return;

  document.getElementById('calc-nombre').textContent = p.nombre;
  document.getElementById('calc-peso').textContent = `${p.peso} kg`;
  document.getElementById('calc-est').textContent = `${p.estatura} cm`;
  document.getElementById('calc-edad-sexo').textContent = `${p.edad} años / ${p.sexo === 'M' ? '♂' : '♀'}`;

  calcularTMB();
}

function calcularTMB() {
  const p = state.paciente;
  if (!p) return;

  const factor = +document.getElementById('actividad').value;
  let tmb;
  if (p.sexo === 'M') {
    tmb = (10 * p.peso) + (6.25 * p.estatura) - (5 * p.edad) + 5;
  } else {
    tmb = (10 * p.peso) + (6.25 * p.estatura) - (5 * p.edad) - 161;
  }

  const mant = tmb * factor;
  state.tmb = tmb;
  state.mantenimiento = mant;

  const cards = [
    { label: 'TMB (Basal)', value: Math.round(tmb), unit: 'kcal/día', delta: null, cls: 'tmb' },
    { label: 'Mantenimiento', value: Math.round(mant), unit: 'kcal/día', delta: null, cls: 'main' },
    { label: 'Volumen Ligero', value: Math.round(mant + 200), unit: 'kcal/día', delta: '+200 kcal', cls: 'volumen-l' },
    { label: 'Volumen Moderado', value: Math.round(mant + 300), unit: 'kcal/día', delta: '+300 kcal', cls: 'volumen-m' },
    { label: 'Definición Ligera', value: Math.round(mant - 200), unit: 'kcal/día', delta: '−200 kcal', cls: 'def-l' },
    { label: 'Definición Moderada', value: Math.round(mant - 300), unit: 'kcal/día', delta: '−300 kcal', cls: 'def-m' },
  ];

  document.getElementById('kcal-grid').innerHTML = cards.map(c => `
    <div class="kcal-card ${c.cls} ${state.kcalObjetivo === c.value ? 'selected-goal' : ''}"
         onclick="seleccionarKcal(${c.value}, this)">
      <div class="kcal-label">${c.label}</div>
      <div class="kcal-value">${c.value.toLocaleString()}</div>
      <div class="kcal-unit">${c.unit}</div>
      ${c.delta ? `<div class="kcal-delta" style="color:${c.cls.includes('def') ? 'var(--red)' : 'var(--blue)'}">${c.delta}</div>` : ''}
    </div>
  `).join('');
}

function seleccionarKcal(val, el) {
  state.kcalObjetivo = val;
  document.querySelectorAll('.kcal-card').forEach(c => c.classList.remove('selected-goal'));
  el.classList.add('selected-goal');
  // Sync to macros section
  document.getElementById('m-kcal').value = val;
  calcularMacros();
  toast(`Objetivo: ${val.toLocaleString()} kcal seleccionado`);
}

// ============================================================
// MACROS
// ============================================================
function refreshMacros() {
  const p = state.paciente;
  document.getElementById('macro-no-patient').style.display = p ? 'none' : 'flex';
  document.getElementById('macro-content').style.display = p ? 'block' : 'none';
  if (!p) return;
  if (!document.getElementById('m-kcal').value && state.kcalObjetivo) {
    document.getElementById('m-kcal').value = Math.round(state.kcalObjetivo);
  }
  calcularMacros();
}

function calcularMacros() {
  const p = state.paciente;
  if (!p) return;

  const kcal = +document.getElementById('m-kcal').value || 0;
  const gkg_prot = +document.getElementById('m-prot').value || 0;
  const gkg_grasa = +document.getElementById('m-grasa').value || 0;

  const prot_g = gkg_prot * p.peso;
  const grasa_g = gkg_grasa * p.peso;
  const prot_kcal = prot_g * 4;
  const grasa_kcal = grasa_g * 9;
  const cho_kcal = Math.max(0, kcal - prot_kcal - grasa_kcal);
  const cho_g = cho_kcal / 4;
  const total_kcal = prot_kcal + grasa_kcal + cho_kcal;

  state.macros = { prot: prot_g, grasa: grasa_g, cho: cho_g, kcal };
  state.kcalObjetivo = kcal;

  const display = document.getElementById('macros-display');
  display.innerHTML = `
    <div class="macro-card prot">
      <div class="macro-name">Proteína</div>
      <div class="macro-grams">${prot_g.toFixed(1)} g</div>
      <div class="macro-kcal">${prot_kcal.toFixed(0)} kcal · ${gkg_prot} g/kg</div>
    </div>
    <div class="macro-card grasa">
      <div class="macro-name">Grasas</div>
      <div class="macro-grams">${grasa_g.toFixed(1)} g</div>
      <div class="macro-kcal">${grasa_kcal.toFixed(0)} kcal · ${gkg_grasa} g/kg</div>
    </div>
    <div class="macro-card cho">
      <div class="macro-name">Carbohidratos</div>
      <div class="macro-grams">${cho_g.toFixed(1)} g</div>
      <div class="macro-kcal">${cho_kcal.toFixed(0)} kcal · calculado</div>
    </div>
    <div class="macro-card total">
      <div class="macro-name">Total Calorías</div>
      <div class="macro-grams">${total_kcal.toFixed(0)}</div>
      <div class="macro-kcal">kcal / día</div>
    </div>
  `;

  // Percentage bars
  const pProt = total_kcal > 0 ? (prot_kcal / total_kcal * 100) : 0;
  const pGrasa = total_kcal > 0 ? (grasa_kcal / total_kcal * 100) : 0;
  const pCho = total_kcal > 0 ? (cho_kcal / total_kcal * 100) : 0;

  document.getElementById('macro-porcentajes').style.display = total_kcal > 0 ? 'block' : 'none';
  document.getElementById('pct-bars').innerHTML = `
    <div class="pct-row">
      <div class="pct-label">Proteína</div>
      <div class="pct-bar-wrap"><div class="pct-bar prot" style="width:${pProt}%"></div></div>
      <div class="pct-value">${pProt.toFixed(1)}%</div>
    </div>
    <div class="pct-row">
      <div class="pct-label">Grasas</div>
      <div class="pct-bar-wrap"><div class="pct-bar grasa" style="width:${pGrasa}%"></div></div>
      <div class="pct-value">${pGrasa.toFixed(1)}%</div>
    </div>
    <div class="pct-row">
      <div class="pct-label">Carbohidratos</div>
      <div class="pct-bar-wrap"><div class="pct-bar cho" style="width:${pCho}%"></div></div>
      <div class="pct-value">${pCho.toFixed(1)}%</div>
    </div>
  `;
}

// ============================================================
// SMAE TABLE
// ============================================================
function renderSMAE() {
  const p = state.paciente;
  document.getElementById('smae-no-patient').style.display = p ? 'none' : 'flex';
  document.getElementById('smae-content').style.display = p ? 'block' : 'none';
  if (!p) return;

  const tbody = document.getElementById('smae-tbody');
  tbody.innerHTML = SMAE.map(g => {
    const eq = state.equivalentes[g.id] || 0;
    return `
      <tr data-group="${g.id}">
        <td>${g.nombre}</td>
        <td>${g.cho}</td>
        <td>${g.prot}</td>
        <td>${g.grasa}</td>
        <td>${g.kcal}</td>
        <td class="eq-col">
          <input type="number" class="eq-input" min="0" step="0.5" value="${eq}"
                 oninput="updateEq('${g.id}', this.value)">
        </td>
        <td class="t-cho">${(g.cho * eq).toFixed(0)}</td>
        <td class="t-prot">${(g.prot * eq).toFixed(0)}</td>
        <td class="t-grasa">${(g.grasa * eq).toFixed(0)}</td>
        <td class="t-kcal">${(g.kcal * eq).toFixed(0)}</td>
      </tr>
    `;
  }).join('');

  updateSMAETotals();
}

function updateEq(groupId, val) {
  state.equivalentes[groupId] = +val || 0;
  const row = document.querySelector(`tr[data-group="${groupId}"]`);
  const g = SMAE.find(x => x.id === groupId);
  const eq = state.equivalentes[groupId];
  row.querySelector('.t-cho').textContent = (g.cho * eq).toFixed(0);
  row.querySelector('.t-prot').textContent = (g.prot * eq).toFixed(0);
  row.querySelector('.t-grasa').textContent = (g.grasa * eq).toFixed(0);
  row.querySelector('.t-kcal').textContent = (g.kcal * eq).toFixed(0);
  updateSMAETotals();
  // Update distribucion if open
  updateDistRow(groupId);
}

function updateSMAETotals() {
  let totCho = 0, totProt = 0, totGrasa = 0, totKcal = 0;
  SMAE.forEach(g => {
    const eq = state.equivalentes[g.id] || 0;
    totCho += g.cho * eq;
    totProt += g.prot * eq;
    totGrasa += g.grasa * eq;
    totKcal += g.kcal * eq;
  });

  state.smaeTotals = { cho: totCho, prot: totProt, grasa: totGrasa, kcal: totKcal };

  document.getElementById('smae-tfoot').innerHTML = `
    <tr>
      <td>TOTAL</td>
      <td></td><td></td><td></td><td></td>
      <td></td>
      <td>${totCho.toFixed(0)}</td>
      <td>${totProt.toFixed(0)}</td>
      <td>${totGrasa.toFixed(0)}</td>
      <td>${totKcal.toFixed(0)}</td>
    </tr>
  `;

  updateAdecuacion(totCho, totProt, totGrasa, totKcal);
}

function updateAdecuacion(cho, prot, grasa, kcal) {
  const m = state.macros;
  if (!m.kcal) return;

  function pctClass(pct) {
    if (pct >= 95 && pct <= 105) return 'ok';
    if (pct >= 85 && pct <= 115) return 'warn';
    return 'over';
  }

  const items = [
    { name: 'CHO', actual: cho, objetivo: m.cho },
    { name: 'Proteína', actual: prot, objetivo: m.prot },
    { name: 'Grasa', actual: grasa, objetivo: m.grasa },
    { name: 'Energía (kcal)', actual: kcal, objetivo: m.kcal },
  ];

  document.getElementById('smae-adecuacion').innerHTML = items.map(item => {
    const pct = item.objetivo > 0 ? (item.actual / item.objetivo * 100) : 0;
    const cls = pctClass(pct);
    return `
      <div class="adec-card">
        <div class="adec-name">${item.name}</div>
        <div class="adec-pct ${cls}">${pct.toFixed(0)}%</div>
        <div class="adec-sub">${item.actual.toFixed(0)} / ${item.objetivo.toFixed(0)} g</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// DISTRIBUCIÓN POR COMIDAS
// ============================================================
const COMIDAS = ['Desayuno', 'Col. AM', 'Comida', 'Col. PM', 'Cena'];
const COMIDA_KEYS = ['desayuno', 'col_am', 'comida', 'col_pm', 'cena'];

function renderDistribucion() {
  const p = state.paciente;
  document.getElementById('dist-no-patient').style.display = p ? 'none' : 'flex';
  document.getElementById('dist-content').style.display = p ? 'block' : 'none';
  if (!p) return;

  const groups = SMAE.filter(g => (state.equivalentes[g.id] || 0) > 0);

  const tbody = document.getElementById('dist-tbody');
  tbody.innerHTML = groups.map(g => {
    const total = state.equivalentes[g.id] || 0;
    const dist = state.distribucion[g.id] || {};
    const distSum = COMIDA_KEYS.reduce((s, k) => s + (dist[k] || 0), 0);
    const ok = Math.abs(distSum - total) < 0.01;
    return `
      <tr data-dist-group="${g.id}">
        <td>${g.nombre}</td>
        <td style="font-weight:700">${total}</td>
        ${COMIDA_KEYS.map(k => `
          <td><input type="number" class="dist-input" min="0" step="0.5" value="${dist[k] || ''}"
               oninput="updateDist('${g.id}', '${k}', this.value)"></td>
        `).join('')}
        <td class="dist-sum ${ok ? 'dist-ok' : 'dist-bad'}" id="ds-${g.id}">${distSum}</td>
        <td class="dist-kcal" id="dk-${g.id}">${(g.kcal * distSum).toFixed(0)}</td>
      </tr>
    `;
  }).join('');

  updateDistTotals();
}

function updateDist(groupId, comidaKey, val) {
  if (!state.distribucion[groupId]) state.distribucion[groupId] = {};
  state.distribucion[groupId][comidaKey] = +val || 0;
  updateDistRowFull(groupId);
  updateDistTotals();
}

function updateDistRow(groupId) {
  // Called when equivalentes change — re-check sums
  const row = document.querySelector(`tr[data-dist-group="${groupId}"]`);
  if (!row) return;
  updateDistRowFull(groupId);
}

function updateDistRowFull(groupId) {
  const row = document.querySelector(`tr[data-dist-group="${groupId}"]`);
  if (!row) return;
  const g = SMAE.find(x => x.id === groupId);
  const total = state.equivalentes[groupId] || 0;
  const dist = state.distribucion[groupId] || {};
  const distSum = COMIDA_KEYS.reduce((s, k) => s + (dist[k] || 0), 0);
  const ok = Math.abs(distSum - total) < 0.01;

  const sumEl = document.getElementById(`ds-${groupId}`);
  const kcalEl = document.getElementById(`dk-${groupId}`);
  if (sumEl) {
    sumEl.textContent = distSum;
    sumEl.className = `dist-sum ${ok ? 'dist-ok' : 'dist-bad'}`;
  }
  if (kcalEl) kcalEl.textContent = (g.kcal * distSum).toFixed(0);
}

function updateDistTotals() {
  const groups = SMAE.filter(g => (state.equivalentes[g.id] || 0) > 0);
  const colTotals = COMIDA_KEYS.map(k =>
    groups.reduce((s, g) => s + ((state.distribucion[g.id] || {})[k] || 0) * g.kcal, 0)
  );
  const totalKcal = colTotals.reduce((a, b) => a + b, 0);

  document.getElementById('dist-tfoot').innerHTML = `
    <tr>
      <td>TOTAL kcal</td>
      <td></td>
      ${colTotals.map(v => `<td>${v.toFixed(0)}</td>`).join('')}
      <td></td>
      <td style="font-weight:800">${totalKcal.toFixed(0)}</td>
    </tr>
  `;
}

// ============================================================
// COMPARACIÓN
// ============================================================
function renderComparacion() {
  const p = state.paciente;
  document.getElementById('comp-no-patient').style.display = p ? 'none' : 'flex';
  document.getElementById('comp-content').style.display = p ? 'block' : 'none';
  if (!p) return;

  const m = state.macros;
  const s = state.smaeTotals || { cho: 0, prot: 0, grasa: 0, kcal: 0 };

  function diffClass(actual, obj) {
    const pct = obj > 0 ? actual / obj : 0;
    if (pct >= 0.95 && pct <= 1.05) return 'ok';
    if (actual < obj) return 'low';
    return 'high';
  }

  function diffText(actual, obj) {
    const diff = actual - obj;
    if (Math.abs(diff) < 0.5) return '✓ OK';
    return diff > 0 ? `+${diff.toFixed(0)}` : `${diff.toFixed(0)}`;
  }

  const rows = [
    { label: 'Carbohidratos (g)', obj: m.cho, actual: s.cho },
    { label: 'Proteína (g)', obj: m.prot, actual: s.prot },
    { label: 'Grasa (g)', obj: m.grasa, actual: s.grasa },
  ];

  document.getElementById('comp-grid').innerHTML = `
    <div class="comp-card">
      <div class="comp-card-title">Macronutrimentos</div>
      ${rows.map(r => `
        <div class="comp-row">
          <div class="comp-row-label">${r.label}</div>
          <div class="comp-row-values">
            <div class="cv-obj">${(r.obj || 0).toFixed(0)}g obj</div>
            <div class="cv-actual">${(r.actual || 0).toFixed(0)}g</div>
            <div class="cv-diff ${diffClass(r.actual, r.obj)}">${diffText(r.actual, r.obj)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="comp-card">
      <div class="comp-card-title">Energía</div>
      <div class="comp-row">
        <div class="comp-row-label">Calorías objetivo</div>
        <div class="comp-row-values">
          <div class="cv-actual">${(m.kcal || 0).toFixed(0)} kcal</div>
        </div>
      </div>
      <div class="comp-row">
        <div class="comp-row-label">Calorías SMAE</div>
        <div class="comp-row-values">
          <div class="cv-actual">${(s.kcal || 0).toFixed(0)} kcal</div>
          <div class="cv-diff ${diffClass(s.kcal, m.kcal)}">${diffText(s.kcal, m.kcal)}</div>
        </div>
      </div>
      <div class="comp-row" style="margin-top:8px; padding-top:8px; border-top: 1px solid var(--border)">
        <div class="comp-row-label">TMB calculada</div>
        <div class="comp-row-values"><div class="cv-actual">${state.tmb.toFixed(0)} kcal</div></div>
      </div>
      <div class="comp-row">
        <div class="comp-row-label">Mantenimiento</div>
        <div class="comp-row-values"><div class="cv-actual">${state.mantenimiento.toFixed(0)} kcal</div></div>
      </div>
    </div>
  `;

  // Adecuación bars
  const adecItems = [
    { label: 'CHO', obj: m.cho || 0, actual: s.cho || 0, color: 'var(--accent)' },
    { label: 'Proteína', obj: m.prot || 0, actual: s.prot || 0, color: 'var(--blue)' },
    { label: 'Grasa', obj: m.grasa || 0, actual: s.grasa || 0, color: 'var(--orange)' },
    { label: 'Energía (kcal)', obj: m.kcal || 0, actual: s.kcal || 0, color: 'var(--purple)' },
  ];

  document.getElementById('adec-bars').innerHTML = adecItems.map(item => {
    const pct = item.obj > 0 ? Math.min(150, item.actual / item.obj * 100) : 0;
    const realPct = item.obj > 0 ? (item.actual / item.obj * 100) : 0;
    let color = item.color;
    if (realPct > 110) color = 'var(--red)';
    else if (realPct < 90) color = 'var(--orange)';
    return `
      <div class="adec-bar-row">
        <div class="adec-bar-label">${item.label}</div>
        <div class="adec-bar-track">
          <div class="adec-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="adec-bar-val" style="color:${color}">${realPct.toFixed(0)}%</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// GUARDAR PLAN
// ============================================================
async function guardarPlan() {
  const p = state.paciente;
  if (!p) { toast('Selecciona un paciente primero', 'error'); return; }

  const data = {
    paciente_id: p.id,
    kcal_objetivo: state.kcalObjetivo || state.macros.kcal,
    proteina_g_kg: +document.getElementById('m-prot').value || 0,
    grasa_g_kg: +document.getElementById('m-grasa').value || 0,
    equivalentes: state.equivalentes
  };

  await fetch('/api/planes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  toast('Plan guardado exitosamente ✓');
}

// ============================================================
// INIT
// ============================================================
cargarPacientes();

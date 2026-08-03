let objects = [];
let categories = [];

const $ = selector => document.querySelector(selector);
const state = {
  search: '', category: 'All', platform: 'All', mode: 'finder', page: 1,
  size: 12, sort: 'className', direction: 1,
  pins: new Set(JSON.parse(localStorage.getItem('sonics-pins') || '[]')),
  selected: null
};

const categoryIcons = {
  animals: '♞', characters: '♟', data: '◫', gear: '◆', plants: '♣',
  rocks: '⬟', structures: '▦', weapons: '⌐', vehicles: '▰', worlds: '◎'
};
const categoryColours = {
  animals: '#c27b42', characters: '#8d6cff', data: '#74849d', gear: '#1687ff',
  plants: '#42a66b', rocks: '#87909f', structures: '#38a5d9', weapons: '#e35d62',
  vehicles: '#f0a62b', worlds: '#26b6a5'
};

function normalise(raw) {
  return {
    id: raw.id,
    className: raw.objectName || 'Unknown',
    displayName: raw.inGameName || raw.objectName || 'Unknown',
    category: raw.category || 'other',
    path: raw.path || 'unknown',
    console: Boolean(raw.usableOnConsole),
    modelType: raw.modelType || 'Unknown',
    tags: raw.searchTags || '',
    imageUrl: raw.imageUrl || '',
    dimensions: raw.dimensionsVisual || null,
    icon: categoryIcons[raw.category] || '◇',
    accent: categoryColours[raw.category] || '#1687ff'
  };
}

function filtered() {
  let list = objects.filter(o => state.category === 'All' || o.category === state.category);
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(o => [o.className, o.displayName, o.path, o.category, o.tags]
      .some(value => value.toLowerCase().includes(q)));
  }
  if (state.platform === 'Console') list = list.filter(o => o.console);
  if (state.mode === 'favorites') list = list.filter(o => state.pins.has(o.id));
  if (state.mode === 'types') {
    list = [...list].sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName));
  } else {
    list = [...list].sort((a, b) => String(a[state.sort]).localeCompare(String(b[state.sort])) * state.direction);
  }
  return list;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function mark(value) {
  const text = escapeHtml(value);
  if (!state.search) return text;
  const safe = escapeHtml(state.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${safe})`, 'ig'), '<mark>$1</mark>');
}

function renderFolders() {
  $('#folderTree').innerHTML = `<button class="folder ${state.category === 'All' ? 'active' : ''}" data-cat="All"><span>▾</span> All objects <span class="folder-count">${objects.length.toLocaleString()}</span></button>` +
    categories.map(category => `<button class="folder ${state.category === category ? 'active' : ''}" data-cat="${escapeHtml(category)}"><span>+</span> ${escapeHtml(category)} <span class="folder-count">${objects.filter(o => o.category === category).length.toLocaleString()}</span></button>`).join('');
  document.querySelectorAll('.folder').forEach(button => button.onclick = () => {
    state.category = button.dataset.cat;
    state.page = 1;
    render();
  });
}

function render() {
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / state.size));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * state.size;
  const page = list.slice(start, start + state.size);

  $('#objectCount').textContent = objects.length.toLocaleString();
  $('#shownCount').textContent = list.length.toLocaleString();
  $('#categoryCount').textContent = new Set(list.map(o => o.category)).size;
  $('#consoleCount').textContent = list.filter(o => o.console).length.toLocaleString();
  $('#crumb').textContent = state.category === 'All' ? 'ALL OBJECTS' : state.category.toUpperCase();
  $('#viewTitle').textContent = state.mode === 'favorites' ? 'Pinned Objects' : state.mode === 'types' ? 'Types Explorer' : 'Object Finder';

  $('#objectRows').innerHTML = page.map(o => `<tr data-id="${escapeHtml(o.id)}" tabindex="0">
    <td><div class="object-icon" style="--accent:${o.accent}">${o.imageUrl ? `<img src="${escapeHtml(o.imageUrl)}" alt="" loading="lazy" onerror="this.remove()">` : o.icon}</div></td>
    <td><span class="class-name">${mark(o.className)}</span></td>
    <td>${mark(o.displayName)}</td>
    <td><span class="path">${mark(o.path)}</span></td>
    <td><span class="badge pc">PC</span>${o.console ? '<span class="badge console">Console</span>' : ''}</td>
    <td><button class="pin ${state.pins.has(o.id) ? 'active' : ''}" data-pin="${escapeHtml(o.id)}" aria-label="Pin ${escapeHtml(o.displayName)}">${state.pins.has(o.id) ? '★' : '☆'}</button></td>
  </tr>`).join('');

  $('#emptyState').classList.toggle('hidden', list.length > 0);
  $('.table-scroll').classList.toggle('hidden', list.length === 0);
  $('#resultLabel').textContent = list.length ? `Showing ${(start + 1).toLocaleString()}–${Math.min(start + state.size, list.length).toLocaleString()} of ${list.length.toLocaleString()}` : 'Showing 0 results';
  $('#pageLabel').textContent = `Page ${state.page.toLocaleString()} / ${pages.toLocaleString()}`;
  $('#prevPage').disabled = state.page === 1;
  $('#nextPage').disabled = state.page === pages;
  $('#clearFavorites').classList.toggle('hidden', state.mode !== 'favorites' || !state.pins.size);
  renderFolders();
  bindRows();
}

function bindRows() {
  document.querySelectorAll('tbody tr').forEach(row => {
    row.onclick = event => { if (!event.target.closest('.pin')) openDetail(row.dataset.id); };
    row.onkeydown = event => { if (event.key === 'Enter') openDetail(row.dataset.id); };
  });
  document.querySelectorAll('[data-pin]').forEach(button => button.onclick = event => {
    event.stopPropagation();
    togglePin(button.dataset.pin);
  });
}

function togglePin(id) {
  state.pins.has(id) ? state.pins.delete(id) : state.pins.add(id);
  localStorage.setItem('sonics-pins', JSON.stringify([...state.pins]));
  render();
  if (state.selected?.id === id) updateDialogPin();
  toast(state.pins.has(id) ? 'Object pinned' : 'Pin removed');
}

function openDetail(id) {
  const o = objects.find(item => item.id === id);
  if (!o) return;
  state.selected = o;
  $('#dialogArt').style.setProperty('--accent', o.accent);
  $('#dialogArt').innerHTML = o.imageUrl ? `<img src="${escapeHtml(o.imageUrl)}" alt="${escapeHtml(o.displayName)}">` : o.icon;
  $('#dialogCategory').textContent = `${o.category} / ${o.modelType}`;
  $('#dialogName').textContent = o.displayName;
  $('#dialogDescription').textContent = o.tags ? `Search tags: ${o.tags}` : 'DayZ game object.';
  const size = o.dimensions ? o.dimensions.map(n => Number(n).toFixed(2)).join(' × ') + ' m' : 'Not available';
  $('#dialogDetails').innerHTML = `<div><dt>Class name</dt><dd>${escapeHtml(o.className)}</dd></div><div><dt>Platform</dt><dd>${o.console ? 'PC + Console' : 'PC only'}</dd></div><div><dt>Config path</dt><dd>${escapeHtml(o.path)}</dd></div><div><dt>Dimensions</dt><dd>${size}</dd></div>`;
  updateDialogPin();
  $('#detailDialog').showModal();
}

function updateDialogPin() {
  if (state.selected) $('#dialogPin').textContent = state.pins.has(state.selected.id) ? '★ Pinned' : '☆ Pin object';
}

function reset() {
  Object.assign(state, {search: '', category: 'All', platform: 'All', mode: 'finder', page: 1});
  $('#searchInput').value = '';
  $('#platformFilter').value = 'All';
  document.querySelectorAll('.mode').forEach((button, index) => button.classList.toggle('active', index === 0));
  render();
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 1800);
}

$('#searchInput').oninput = event => { state.search = event.target.value.trim(); state.page = 1; render(); };
$('#pageSize').onchange = event => { state.size = Number(event.target.value); state.page = 1; render(); };
$('#platformFilter').onchange = event => { state.platform = event.target.value; state.page = 1; render(); };
$('#prevPage').onclick = () => { state.page--; render(); };
$('#nextPage').onclick = () => { state.page++; render(); };
$('#resetButton').onclick = reset;
$('#emptyReset').onclick = reset;
document.querySelectorAll('.mode').forEach(button => button.onclick = () => {
  state.mode = button.dataset.mode;
  state.page = 1;
  document.querySelectorAll('.mode').forEach(item => item.classList.toggle('active', item === button));
  render();
});
document.querySelectorAll('.sort').forEach(button => button.onclick = () => {
  state.direction = state.sort === button.dataset.key ? -state.direction : 1;
  state.sort = button.dataset.key;
  render();
});
document.querySelectorAll('[data-toast]').forEach(button => button.onclick = () => toast(button.dataset.toast));
$('#themeToggle').onclick = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('sonics-theme', document.body.classList.contains('light') ? 'light' : 'dark');
};
$('#exportButton').onclick = () => {
  const rows = filtered();
  const csv = ['Class Name,In-game Name,Category,Path,Console', ...rows.map(o => [o.className, o.displayName, o.category, o.path, o.console ? 'Yes' : 'No'].map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
  link.download = 'sonics-objects.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  toast('CSV exported');
};
$('#clearFavorites').onclick = () => { state.pins.clear(); localStorage.removeItem('sonics-pins'); render(); toast('Pins cleared'); };
$('#dialogClose').onclick = () => $('#detailDialog').close();
$('#detailDialog').onclick = event => { if (event.target === $('#detailDialog')) $('#detailDialog').close(); };
$('#dialogPin').onclick = () => togglePin(state.selected.id);
$('#copyClass').onclick = async () => { await navigator.clipboard.writeText(state.selected.className); toast('Class name copied'); };
document.addEventListener('keydown', event => {
  if (event.key === '/' && document.activeElement !== $('#searchInput')) { event.preventDefault(); $('#searchInput').focus(); }
  if (event.key === 'Escape' && !$('#detailDialog').open) $('#searchInput').blur();
});

async function loadObjects() {
  $('#objectCount').textContent = 'Loading…';
  try {
    const response = await fetch('objects.full.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    objects = (await response.json()).map(normalise);
    categories = [...new Set(objects.map(o => o.category))].sort();
    render();
  } catch (error) {
    $('#objectCount').textContent = 'Unavailable';
    $('#emptyState').classList.remove('hidden');
    $('.table-scroll').classList.add('hidden');
    $('#emptyState h2').textContent = 'Object database failed to load';
    $('#emptyState p').textContent = 'Refresh the page to try again.';
    console.error(error);
  }
}

if (localStorage.getItem('sonics-theme') === 'light') document.body.classList.add('light');
loadObjects();

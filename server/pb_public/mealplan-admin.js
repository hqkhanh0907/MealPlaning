const get = (id) => document.getElementById(id);
const accounts = get('accounts');
const tables = get('tables');
const status = get('status');
let token = '';
let workspace;
let sortColumn = '';
let descending = false;
let editing;

async function call(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).message ?? 'Không thực hiện được.');
  return response.json();
}

function error(message) {
  status.textContent = message;
}

function option(value, label) {
  const entry = document.createElement('option');
  entry.value = value;
  entry.textContent = label;
  return entry;
}

function button(label, onClick) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.onclick = onClick;
  return control;
}

function render() {
  get('edit').hidden = true;
  const records = workspace?.snapshot?.tables?.[tables.value] ?? [];
  const columns = Object.keys(records[0] ?? {});
  const header = document.createElement('tr');
  for (const column of columns) {
    const element = document.createElement('th');
    element.append(button(column, () => {
      descending = sortColumn === column && !descending;
      sortColumn = column;
      render();
    }));
    header.append(element);
  }
  header.append(document.createElement('th'));
  get('head').replaceChildren(header);
  const sorted = [...records.entries()].sort(([, a], [, b]) => {
    const aa = a[sortColumn] ?? '';
    const bb = b[sortColumn] ?? '';
    const result = typeof aa === 'number' && typeof bb === 'number'
      ? aa - bb : String(aa).localeCompare(String(bb), 'vi');
    return descending ? -result : result;
  });
  get('rows').replaceChildren(...sorted.map(([index, row]) => {
    const view = document.createElement('tr');
    for (const column of columns) {
      const cell = document.createElement('td');
      cell.textContent = String(row[column] ?? '').slice(0, 80);
      view.append(cell);
    }
    const last = document.createElement('td');
    last.append(button('Sửa', () => {
      editing = { table: tables.value, index, owner: accounts.value };
      get('record').value = JSON.stringify(row, null, 2);
      get('edit').hidden = false;
      get('record').focus();
    }));
    view.append(last);
    return view;
  }));
}

async function load() {
  const target = accounts.value;
  workspace = target ? await call('/api/mealplan-admin/workspaces/' + target) : null;
  const previous = tables.value;
  const names = Object.keys(workspace?.snapshot?.tables ?? {});
  tables.replaceChildren(...names.map((name) => option(name, name)));
  if (names.includes(previous)) tables.value = previous;
  render();
}

get('login').onsubmit = async (event) => {
  event.preventDefault();
  try {
    const form = new FormData(event.currentTarget);
    const auth = await call('/api/collections/_superusers/auth-with-password', {
      identity: form.get('email'), password: form.get('password'),
    });
    token = auth.token;
    event.target.reset();
    const owners = await call('/api/mealplan-admin/workspaces');
    accounts.replaceChildren(...owners.map((owner) => option(owner.ownerId, owner.username)));
    get('login').hidden = true;
    get('data').hidden = false;
    await load();
    error('');
  } catch (failure) {
    error(failure.message);
  }
};

accounts.onchange = () => load().catch((failure) => error(failure.message));
tables.onchange = render;
get('logout').onclick = () => location.reload();
get('edit').onsubmit = async (event) => {
  event.preventDefault();
  try {
    if (editing.owner !== accounts.value) return;
    const snapshot = structuredClone(workspace.snapshot);
    snapshot.tables[editing.table][editing.index] = JSON.parse(get('record').value);
    await call('/api/mealplan-admin/workspaces/' + editing.owner, {
      operationId: crypto.randomUUID(), baseRevision: workspace.revision, snapshot,
    });
    await load();
    error('Đã lưu. Android sẽ tải phiên bản mới khi đồng bộ.');
  } catch (failure) {
    error(failure.message);
  }
};

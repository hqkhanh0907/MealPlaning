import {
  columnLabel, displayValue, editableFields, makeRowViews, rowKey,
  searchText, tableLabel, tables as catalog, viCollator,
} from './mealplan-admin-data.js';

const get = (id) => document.getElementById(id);
const signIn = get('login');
const accounts = get('accounts');
const tables = get('tables');
const dialog = get('edit-dialog');
const editForm = get('edit');
const raw = get('record');
const pageSize = 50;
const workspacePath = '/api/mealplan-admin/workspaces';
let token = '';
let owners = [];
let ownerId = '';
let loadRequest;
let workspace;
let editing;
let scope;
let sort = { key: '', descending: false };
let limit = pageSize;

const owner = () => owners.find((entry) => entry.ownerId === ownerId);
const ownerName = (entry) => entry.name?.trim() || 'Chưa có họ tên';
const ownerLabel = (entry) => ownerName(entry) + ' (' + entry.username + ')';

async function call(path, { body, signal } = {}) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw Object.assign(new Error('Request failed.'), { status: response.status });
  return response.json();
}

function feedback(id, message = '', tone = '') {
  get(id).textContent = message;
  get(id).dataset.tone = tone;
}

function option(value, label) {
  const entry = document.createElement('option');
  entry.value = value;
  entry.textContent = label;
  return entry;
}

function button(label, onClick, style) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.className = style;
  control.onclick = onClick;
  return control;
}

function renderOwners() {
  const query = searchText(get('owner-search').value).trim();
  const [key, direction] = get('owner-sort').value.split(':');
  const matches = owners.filter((entry) => searchText(entry.name + ' ' + entry.username).includes(query));
  matches.sort((a, b) => {
    const order = viCollator.compare(a[key] || '', b[key] || '');
    return (direction === 'desc' ? -order : order)
      || viCollator.compare(a.username, b.username) || a.ownerId.localeCompare(b.ownerId);
  });
  const unlistedOwner = ownerId && !matches.some((entry) => entry.ownerId === ownerId);
  accounts.replaceChildren(option('', matches.length ? 'Chọn tài khoản' : 'Không có kết quả'),
    ...matches.map((entry) => option(entry.ownerId, ownerLabel(entry))));
  if (unlistedOwner) {
    const selected = option(ownerId, ownerLabel(owner()) + ' (đang xem)');
    selected.hidden = true;
    accounts.append(selected);
  }
  accounts.value = ownerId;
  accounts.disabled = matches.length === 0;
  get('owner-count').textContent = matches.length + ' tài khoản';
}

function resetFilters() {
  get('record-search').value = '';
  get('record-date').value = '';
  scope = null;
  sort = { key: '', descending: false };
  limit = pageSize;
}

function rowAction(table, rawRow, row) {
  const cell = document.createElement('td');
  const key = rowKey(table, rawRow);
  cell.className = 'actions';
  const edit = button('Sửa', () => openEditor(table, rawRow, row), 'quiet');
  edit.setAttribute('aria-label', 'Sửa ' + recordContext(table, row));
  cell.append(edit);
  if (table === 'workout_session' || table === 'day_plan') {
    const workout = table === 'workout_session';
    cell.append(button(workout ? 'Xem hiệp' : 'Xem món', () => {
      tables.value = workout ? 'workout_set' : 'planned_dish';
      resetFilters();
      scope = { key, label: recordContext(table, row) };
      renderRecords();
      tables.focus();
    }, 'link'));
  }
  return cell;
}

function renderRecords(restoreSortFocus = false) {
  const table = tables.value;
  const records = workspace?.snapshot?.tables[table] ?? [];
  const useRawColumns = get('all-columns').checked;
  const preferred = catalog[table]?.slice(1) ?? [];
  const rawColumns = Object.keys(records[0] ?? {});
  const columns = useRawColumns || preferred.length === 0 ? rawColumns : preferred;
  const view = workspace?.view;
  const dateFilter = get('date-filter');
  const query = searchText(get('record-search').value).trim();
  const date = get('record-date').value;
  const hasDate = preferred.includes('_date') || rawColumns.includes('date');
  dateFilter.hidden = !hasDate;

  const result = records.map((record) => ({ record, row: view(table, record) })).filter(({ record, row }) => {
    if (scope && row.parent !== scope.key) return false;
    if (hasDate && date && !String(row._date ?? '').startsWith(date)) return false;
    return !query || [row._title, row.name, row._ingredient, row._date, rowKey(table, record)]
      .some((value) => searchText(value).includes(query));
  });
  const sortKey = sort.key || (preferred.includes('set_number') ? 'set_number' : hasDate ? '_date' : preferred[0]);
  const order = sort.key ? sort.descending : sortKey === '_date';
  const recordSort = get('record-sort');
  recordSort.replaceChildren(...columns.flatMap((key) => [
    option(key + ':asc', columnLabel(table, key) + ' ↑'),
    option(key + ':desc', columnLabel(table, key) + ' ↓'),
  ]));
  recordSort.value = sortKey + (order ? ':desc' : ':asc');
  result.sort(({ row: a }, { row: b }) => {
    const first = a[sortKey] ?? '';
    const second = b[sortKey] ?? '';
    const compared = typeof first === 'number' && typeof second === 'number'
      ? first - second : viCollator.compare(String(first), String(second));
    return order ? -compared : compared;
  });

  const header = document.createElement('tr');
  const actionsLabel = document.createElement('th');
  actionsLabel.scope = 'col';
  actionsLabel.textContent = 'Thao tác';
  header.append(actionsLabel);
  let activeSortButton;
  for (const key of columns) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    const control = button(columnLabel(table, key), () => {
      sort = { key, descending: sortKey === key && !order };
      renderRecords(true);
    }, '');
    if (sortKey === key) {
      cell.setAttribute('aria-sort', order ? 'descending' : 'ascending');
      control.textContent += order ? ' ↓' : ' ↑';
      activeSortButton = control;
    }
    cell.append(control);
    header.append(cell);
  }
  get('head').replaceChildren(header);
  get('rows').replaceChildren(...result.slice(0, limit).map(({ record, row }) => {
    const item = document.createElement('tr');
    item.dataset.recordId = rowKey(table, record);
    item.append(rowAction(table, record, row));
    for (const key of columns) {
      const cell = document.createElement('td');
      cell.dataset.label = columnLabel(table, key);
      cell.textContent = displayValue(key, row);
      item.append(cell);
    }
    return item;
  }));

  get('scope-region').hidden = !scope;
  get('scope-label').textContent = scope?.label ?? '';
  get('record-count').textContent = result.length > limit
    ? limit + ' / ' + result.length + ' bản ghi' : result.length + ' bản ghi';
  get('more').hidden = result.length <= limit;
  get('more').textContent = 'Xem thêm ' + Math.min(pageSize, Math.max(0, result.length - limit)) + ' bản ghi';
  get('table-wrap').hidden = result.length === 0;
  get('table-wrap').querySelector('table').classList.toggle('wide-table', useRawColumns);
  get('empty-records').hidden = result.length !== 0;
  get('empty-records').textContent = records.length
    ? 'Không có bản ghi khớp bộ lọc.' : 'Tài khoản chưa có bản ghi loại này.';
  if (restoreSortFocus) activeSortButton?.focus();
}

async function loadWorkspace() {
  loadRequest?.abort();
  workspace = undefined;
  const chosen = owner();
  get('records-view').hidden = true;
  get('head').replaceChildren();
  get('rows').replaceChildren();
  get('reload').hidden = true;
  get('owner-name').textContent = chosen ? ownerName(chosen) : 'Dữ liệu tài khoản';
  get('owner-username').textContent = chosen ? 'Tên đăng nhập: ' + chosen.username : '';
  if (!chosen) {
    feedback('status', owners.length ? 'Chọn tài khoản để xem dữ liệu.' : 'Chưa có tài khoản đăng ký.');
    return false;
  }

  const request = new AbortController();
  loadRequest = request;
  feedback('status', 'Đang tải dữ liệu…');
  try {
    const response = await call(workspacePath + '/' + encodeURIComponent(chosen.ownerId), { signal: request.signal });
    if (request.signal.aborted) return false;
    if (!response.snapshot) {
      feedback('status', 'Tài khoản chưa có dữ liệu đồng bộ.');
      return true;
    }
    workspace = { ...response, view: makeRowViews(response.snapshot) };
    const previous = tables.value;
    const names = Object.keys(response.snapshot.tables);
    tables.replaceChildren(...names.map((name) => option(name, tableLabel(name))));
    const initial = ['workout_session', 'day_plan', ...names].find((name) => response.snapshot.tables[name]?.length);
    tables.value = names.includes(previous) ? previous : initial ?? names[0];
    renderRecords();
    get('records-view').hidden = false;
    feedback('status');
    return true;
  } catch (error) {
    if (request.signal.aborted) return false;
    feedback('status', error.status === 401
      ? 'Phiên quản trị đã hết. Hãy đăng xuất rồi đăng nhập lại.'
      : 'Không tải được dữ liệu tài khoản.', 'error');
    get('reload').hidden = error.status === 401;
    return false;
  }
}

function recordContext(table, row) {
  const title = row._title || tableLabel(table);
  const date = row._date ? ', ' + displayValue('_date', row) : '';
  const set = row.set_number ? ', hiệp ' + row.set_number : '';
  return title + set + date;
}

function renderQuickFields(table, row) {
  get('quick-fields').replaceChildren(...editableFields(table, row).map(([key, minimum, step, maximum]) => {
    const field = document.createElement('div');
    field.className = 'input-wrapper';
    const label = document.createElement('label');
    label.className = 'input-label';
    label.textContent = columnLabel(table, key);
    label.htmlFor = 'quick-' + key;
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.className = 'input-native';
    input.type = 'number';
    input.inputMode = step === 1 ? 'numeric' : 'decimal';
    input.required = true;
    input.min = String(minimum);
    input.step = String(step);
    if (maximum !== undefined) input.max = String(maximum);
    input.value = String(row[key]);
    input.dataset.key = key;
    field.append(label, input);
    return field;
  }));
}

function openEditor(table, record, row) {
  editing = { ownerId, table, key: rowKey(table, record), workspace };
  get('edit-title').textContent = 'Sửa ' + tableLabel(table).toLowerCase();
  get('edit-owner').textContent = ownerLabel(owner());
  get('edit-context').textContent = recordContext(table, row);
  feedback('edit-status');
  get('edit-reload').hidden = true;
  get('save').disabled = false;
  raw.value = JSON.stringify(record, null, 2);
  renderQuickFields(table, record);
  const first = get('quick-fields').querySelector('input');
  get('advanced').open = !first;
  get('quick-fields').hidden = !first;
  dialog.showModal();
  (first ?? raw).focus();
}

function closeEditor() {
  if (!editing?.saving) dialog.close();
}

function candidate() {
  try {
    const record = JSON.parse(raw.value);
    if (!record || typeof record !== 'object' || Array.isArray(record) || rowKey(editing.table, record) !== editing.key) {
      feedback('edit-status', 'Giữ nguyên mã của bản ghi đang sửa.', 'error');
      return;
    }
    return record;
  } catch {
    feedback('edit-status', 'Dữ liệu JSON chưa đúng cú pháp.', 'error');
  }
}

function applyQuickFields() {
  for (const input of get('quick-fields').querySelectorAll('input')) {
    if (!input.reportValidity()) return false;
  }
  const record = candidate();
  if (!record) return false;
  for (const input of get('quick-fields').querySelectorAll('input')) {
    record[input.dataset.key] = input.valueAsNumber;
  }
  raw.value = JSON.stringify(record, null, 2);
  return true;
}

get('advanced').querySelector('summary').addEventListener('click', (event) => {
  event.preventDefault();
  if (!editing || editing.saving) return;
  const advanced = get('advanced');
  const fields = get('quick-fields');
  if (advanced.open) {
    const record = candidate();
    if (!record) return;
    renderQuickFields(editing.table, record);
  } else {
    if (!applyQuickFields()) return;
    for (const input of fields.querySelectorAll('input')) input.disabled = true;
  }
  advanced.open = !advanced.open;
  fields.hidden = advanced.open;
});

get('owner-search').addEventListener('input', renderOwners);
get('owner-sort').addEventListener('change', renderOwners);
accounts.addEventListener('change', () => {
  ownerId = accounts.value;
  resetFilters();
  renderOwners();
  void loadWorkspace();
});
tables.addEventListener('change', () => {
  resetFilters();
  renderRecords();
});
get('record-sort').addEventListener('change', (event) => {
  const [key, direction] = event.target.value.split(':');
  sort = { key, descending: direction === 'desc' };
  renderRecords();
});
for (const [id, event] of [['record-search', 'input'], ['record-date', 'change'], ['all-columns', 'change']]) {
  get(id).addEventListener(event, () => {
    limit = pageSize;
    renderRecords();
  });
}
get('clear-scope').onclick = () => {
  scope = null;
  renderRecords();
  tables.focus();
};
get('more').onclick = () => {
  limit += pageSize;
  renderRecords();
  if (get('more').hidden) get('table-wrap').focus();
};
get('reload').onclick = () => { void loadWorkspace(); };

signIn.onsubmit = async (event) => {
  event.preventDefault();
  const submit = get('sign-in-submit');
  if (submit.disabled) return;
  submit.disabled = true;
  feedback('login-status', 'Đang đăng nhập…');
  try {
    const form = new FormData(signIn);
    const auth = await call('/api/collections/_superusers/auth-with-password', {
      body: { identity: form.get('email'), password: form.get('password') },
    });
    token = auth.token;
    owners = await call(workspacePath);
    ownerId = '';
    signIn.reset();
    renderOwners();
    get('sign-in').hidden = true;
    get('data').hidden = false;
    get('logout').hidden = false;
    get('owner-search').focus();
    void loadWorkspace();
  } catch (error) {
    token = '';
    feedback('login-status', [400, 401, 403].includes(error.status)
      ? 'Kiểm tra email và mật khẩu quản trị.'
      : 'Không thể đăng nhập. Hãy thử lại.', 'error');
  } finally {
    submit.disabled = false;
  }
};
get('logout').onclick = () => location.reload();

get('cancel').onclick = closeEditor;
dialog.addEventListener('cancel', (event) => {
  if (editing?.saving) event.preventDefault();
});
dialog.addEventListener('close', () => {
  if (!dialog.open) editing = undefined;
});
get('edit-reload').onclick = async () => {
  closeEditor();
  await loadWorkspace();
  tables.focus();
};

editForm.onsubmit = async (event) => {
  event.preventDefault();
  const edit = editing;
  if (!edit || edit.saving || edit.ownerId !== ownerId) return;
  if (!get('advanced').open && !applyQuickFields()) return;
  const record = candidate();
  if (!record) return;

  const { snapshot, revision } = edit.workspace;
  const target = snapshot.tables[edit.table];
  const index = target.findIndex((row) => rowKey(edit.table, row) === edit.key);
  if (index < 0) {
    feedback('edit-status', 'Không tìm thấy bản ghi.', 'error');
    get('edit-reload').hidden = false;
    return;
  }
  const rows = [...target];
  rows[index] = record;
  const revised = { ...snapshot, tables: { ...snapshot.tables, [edit.table]: rows } };
  const draft = JSON.stringify(record);
  if (edit.draft !== draft) edit.operationId = crypto.randomUUID();
  edit.draft = draft;
  edit.saving = true;
  get('save').disabled = true;
  get('cancel').disabled = true;
  feedback('edit-status', 'Đang lưu…');

  try {
    await call(workspacePath + '/' + encodeURIComponent(edit.ownerId), {
      body: { operationId: edit.operationId, baseRevision: revision, snapshot: revised },
    });
    dialog.close();
    const loaded = await loadWorkspace();
    if (loaded) {
      feedback('status', 'Đã lưu. Android sẽ nhận dữ liệu khi đồng bộ.', 'success');
      const editedRow = [...get('rows').rows].find((row) => row.dataset.recordId === edit.key);
      (editedRow?.querySelector('button') ?? tables).focus();
    } else if (ownerId === edit.ownerId) {
      feedback('status', 'Đã lưu bản ghi. Không tải được dữ liệu mới.', 'error');
    }
  } catch (error) {
    const messages = {
      400: 'Dữ liệu không hợp lệ. Kiểm tra các giá trị rồi thử lại.',
      401: 'Phiên quản trị đã hết. Hãy đăng nhập lại.',
      409: 'Dữ liệu đã đổi. Tải bản mới để kiểm tra trước khi sửa lại.',
    };
    feedback('edit-status', messages[error.status] ?? 'Chưa thể xác nhận đã lưu. Hãy thử lại.', 'error');
    get('edit-reload').hidden = error.status !== 409;
  } finally {
    edit.saving = false;
    get('save').disabled = !get('edit-reload').hidden;
    get('cancel').disabled = false;
  }
};

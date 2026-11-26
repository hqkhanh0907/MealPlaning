const get = (id) => document.getElementById(id);
const form = get('login');
const submit = get('sign-in-submit');
const refresh = get('refresh');
const feedback = get('refresh-feedback');
const formatDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' });
const formatNumber = new Intl.NumberFormat('vi-VN');
const failures = [
  ['conflict', 'Xung đột dữ liệu'],
  ['invalid_request', 'Yêu cầu không hợp lệ'],
  ['unavailable', 'Không xử lý được'],
];
let token = '';
let request;

async function call(path, { signal, body } = {}) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(token ? { Authorization: token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: 'no-store',
  });
  if (!response.ok) throw Object.assign(new Error(), { status: response.status });
  return response.json();
}

function date(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? formatDate.format(new Date(value))
    : 'Chưa có';
}

function displayServices(services) {
  for (const id of ['api', 'database']) {
    const target = get(id + '-state');
    const available = services?.[id] === 'available';
    target.textContent = available ? 'Hoạt động' : 'Chưa xác minh';
    target.classList.toggle('available', available);
  }
}

function displayFailures(values) {
  const list = get('failures');
  list.replaceChildren(...failures.map(([code, label]) => {
    const event = values?.find((entry) => entry.code === code);
    const row = document.createElement('li');
    const name = document.createElement('strong');
    const count = document.createElement('span');
    const lastSeen = document.createElement('small');
    name.textContent = label;
    count.textContent = event ? formatNumber.format(event.count) + ' lần' : '—';
    lastSeen.textContent = event?.lastSeenAt ? 'Gần nhất ' + date(event.lastSeenAt) : 'Chưa ghi nhận';
    row.append(name, count, lastSeen);
    return row;
  }));
}

function render(data) {
  displayServices(data?.services);
  get('release').textContent = data?.release ?? '—';
  get('last-upload').textContent = data ? date(data.sync?.lastUploadAt) : '—';
  get('last-download').textContent = data ? date(data.sync?.lastDownloadAt) : '—';
  displayFailures(data?.syncFailures);
}

function signedOut(message = '') {
  request?.abort();
  request = undefined;
  token = '';
  render();
  get('status').hidden = true;
  get('logout').hidden = true;
  get('sign-in').hidden = false;
  get('login-feedback').textContent = message;
  get('operator-email').focus();
}

async function loadStatus() {
  request?.abort();
  const active = new AbortController();
  request = active;
  refresh.disabled = true;
  feedback.textContent = 'Đang tải trạng thái…';
  try {
    const data = await call('/api/mealplan-ops/status', {
      signal: AbortSignal.any([active.signal, AbortSignal.timeout(10_000)]),
    });
    if (request !== active) return;
    render(data);
    feedback.textContent = 'Đã kiểm tra lúc ' + formatDate.format(new Date()) + '.';
  } catch (error) {
    if (request !== active) return;
    if (error.status === 401 || error.status === 403) {
      signedOut('Phiên đã hết hạn. Đăng nhập lại để tiếp tục.');
    } else {
      render();
      feedback.textContent = 'Chưa tải được trạng thái. Hãy làm mới.';
    }
  } finally {
    if (request === active) refresh.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submit.disabled) return;
  const password = get('operator-password');
  const message = get('login-feedback');
  submit.disabled = true;
  message.textContent = 'Đang đăng nhập…';
  try {
    const data = await call('/api/collections/mealplan_operators/auth-with-password', {
      body: { identity: get('operator-email').value.trim(), password: password.value },
      signal: AbortSignal.timeout(10_000),
    });
    token = data.token;
    get('sign-in').hidden = true;
    get('status').hidden = false;
    get('logout').hidden = false;
    get('status-title').focus();
    void loadStatus();
  } catch (error) {
    message.textContent = [400, 401, 403].includes(error.status)
      ? 'Email hoặc mật khẩu vận hành không đúng.'
      : 'Chưa kết nối được. Hãy thử lại.';
  } finally {
    password.value = '';
    submit.disabled = false;
  }
});

get('logout').addEventListener('click', () => signedOut());
refresh.addEventListener('click', () => void loadStatus());

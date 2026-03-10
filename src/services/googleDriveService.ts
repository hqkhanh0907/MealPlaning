const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const BACKUP_FILE_NAME = 'meal-planner-backup.json';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listBackups = async (accessToken: string): Promise<DriveFileInfo[]> => {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILE_NAME}'`,
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'modifiedTime desc',
  });
  const res = await fetch(`${DRIVE_API}?${params}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = await res.json();
  return data.files ?? [];
};

export const downloadBackup = async (accessToken: string, fileId: string): Promise<Record<string, unknown>> => {
  const res = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.json();
};

export const downloadLatestBackup = async (accessToken: string): Promise<{ data: Record<string, unknown>; file: DriveFileInfo } | null> => {
  const files = await listBackups(accessToken);
  if (files.length === 0) return null;
  const latest = files[0];
  const data = await downloadBackup(accessToken, latest.id);
  return { data, file: latest };
};

export const uploadBackup = async (accessToken: string, data: Record<string, unknown>): Promise<DriveFileInfo> => {
  const existing = await listBackups(accessToken);
  const content = JSON.stringify(data);

  if (existing.length > 0) {
    const fileId = existing[0].id;
    const res = await fetch(`${DRIVE_UPLOAD_API}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(accessToken),
        'Content-Type': 'application/json',
      },
      body: content,
    });
    if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
    return res.json();
  }

  const boundary = '___meal_planner_boundary___';
  const metadata = {
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };
  const body = [
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    'Content-Type: application/json\r\n\r\n',
    content,
    `\r\n--${boundary}--`,
  ].join('');

  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart`, {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`);
  return res.json();
};

export const deleteBackup = async (accessToken: string, fileId: string): Promise<void> => {
  const res = await fetch(`${DRIVE_API}/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Drive delete failed: ${res.status}`);
};

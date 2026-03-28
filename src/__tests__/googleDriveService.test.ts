import {
  listBackups,
  downloadBackup,
  downloadLatestBackup,
  uploadBackup,
  deleteBackup,
} from '../services/googleDriveService';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const TOKEN = 'test-access-token';

const mockFile = {
  id: 'file-1',
  name: 'meal-planner-backup.sqlite',
  modifiedTime: '2024-01-15T10:00:00Z',
};

const mockResponse = (body: unknown, ok = true, status = 200): Response =>
  ({
    ok,
    status,
    json: () => Promise.resolve(body),
    arrayBuffer: () => Promise.resolve(body instanceof Uint8Array ? body.buffer : new ArrayBuffer(0)),
  }) as unknown as Response;

describe('googleDriveService', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  describe('listBackups', () => {
    it('sends correct URL with query params and auth header', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));

      await listBackups(TOKEN);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0];
      const urlStr = url as string;
      expect(urlStr).toContain(DRIVE_API);
      expect(urlStr).toContain('spaces=appDataFolder');
      expect(urlStr).toContain('fields=files');
      expect(urlStr).toContain('orderBy=modifiedTime+desc');
      expect(urlStr).toContain("q=name+%3D+%27meal-planner-backup.sqlite%27");
      expect(options).toEqual({
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    });

    it('returns files from response', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));

      const result = await listBackups(TOKEN);

      expect(result).toEqual([mockFile]);
    });

    it('returns empty array when response has no files property', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      const result = await listBackups(TOKEN);

      expect(result).toEqual([]);
    });

    it('returns empty array when files is undefined', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: undefined }));

      const result = await listBackups(TOKEN);

      expect(result).toEqual([]);
    });

    it('throws on non-ok response', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 401));

      await expect(listBackups(TOKEN)).rejects.toThrow('Drive list failed: 401');
    });
  });

  describe('downloadBackup', () => {
    it('sends correct URL with alt=media and auth header', async () => {
      const binaryData = new Uint8Array([1, 2, 3]);
      fetchSpy.mockResolvedValueOnce(mockResponse(binaryData));

      await downloadBackup(TOKEN, 'file-1');

      expect(fetchSpy).toHaveBeenCalledWith(`${DRIVE_API}/file-1?alt=media`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    });

    it('returns Uint8Array data', async () => {
      const binaryData = new Uint8Array([10, 20, 30]);
      fetchSpy.mockResolvedValueOnce(mockResponse(binaryData));

      const result = await downloadBackup(TOKEN, 'file-1');

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('throws on non-ok response', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 403));

      await expect(downloadBackup(TOKEN, 'file-1')).rejects.toThrow(
        'Drive download failed: 403',
      );
    });
  });

  describe('downloadLatestBackup', () => {
    it('returns null when no backups exist', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));

      const result = await downloadLatestBackup(TOKEN);

      expect(result).toBeNull();
    });

    it('returns latest backup data and file info', async () => {
      const binaryData = new Uint8Array([1, 2, 3]);
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));
      fetchSpy.mockResolvedValueOnce(mockResponse(binaryData));

      const result = await downloadLatestBackup(TOKEN);

      expect(result).not.toBeNull();
      expect(result!.file).toEqual(mockFile);
      expect(result!.data).toBeInstanceOf(Uint8Array);
    });

    it('uses the first file from the list (most recent)', async () => {
      const olderFile = { id: 'file-2', name: 'meal-planner-backup.sqlite', modifiedTime: '2024-01-10T10:00:00Z' };
      const binaryData = new Uint8Array([1, 2]);
      fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile, olderFile] }));
      fetchSpy.mockResolvedValueOnce(mockResponse(binaryData));

      await downloadLatestBackup(TOKEN);

      const secondCallUrl = fetchSpy.mock.calls[1][0] as string;
      expect(secondCallUrl).toContain(`/${mockFile.id}?alt=media`);
    });
  });

  describe('uploadBackup', () => {
    const uploadData = new Uint8Array([1, 2, 3, 4]);

    describe('when existing backup exists (PATCH path)', () => {
      it('updates existing file with PATCH', async () => {
        const updatedFile = { ...mockFile, modifiedTime: '2024-01-16T10:00:00Z' };
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(updatedFile));

        const result = await uploadBackup(TOKEN, uploadData);

        expect(result).toEqual(updatedFile);
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      it('sends PATCH to correct upload URL with file ID', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(mockFile));

        await uploadBackup(TOKEN, uploadData);

        const [url, options] = fetchSpy.mock.calls[1];
        expect(url).toBe(`${DRIVE_UPLOAD_API}/${mockFile.id}?uploadType=media`);
        expect((options as RequestInit).method).toBe('PATCH');
        expect((options as RequestInit).headers).toEqual(
          expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/octet-stream',
          }),
        );
        expect((options as RequestInit).body).toEqual(uploadData);
      });

      it('throws on PATCH failure', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [mockFile] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 500));

        await expect(uploadBackup(TOKEN, uploadData)).rejects.toThrow(
          'Drive update failed: 500',
        );
      });
    });

    describe('when no existing backup (POST multipart path)', () => {
      it('creates new file with POST multipart', async () => {
        const newFile = { id: 'new-1', name: 'meal-planner-backup.sqlite', modifiedTime: '2024-01-16T12:00:00Z' };
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(newFile));

        const result = await uploadBackup(TOKEN, uploadData);

        expect(result).toEqual(newFile);
      });

      it('sends POST to correct upload URL', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(mockFile));

        await uploadBackup(TOKEN, uploadData);

        const [url, options] = fetchSpy.mock.calls[1];
        expect(url).toBe(`${DRIVE_UPLOAD_API}?uploadType=multipart`);
        expect((options as RequestInit).method).toBe('POST');
      });

      it('includes correct multipart headers', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(mockFile));

        await uploadBackup(TOKEN, uploadData);

        const headers = (fetchSpy.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
        expect(headers.Authorization).toBe(`Bearer ${TOKEN}`);
        expect(headers['Content-Type']).toBe(
          'multipart/related; boundary=___meal_planner_boundary___',
        );
      });

      it('constructs multipart body as Blob with boundary and metadata', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(mockFile));

        await uploadBackup(TOKEN, uploadData);

        const body = (fetchSpy.mock.calls[1][1] as RequestInit).body;
        expect(body).toBeInstanceOf(Blob);

        const text = await (body as Blob).text();
        const boundary = '___meal_planner_boundary___';

        expect(text).toContain(`--${boundary}`);
        expect(text).toContain(`--${boundary}--`);
        expect(text).toContain('Content-Type: application/json; charset=UTF-8');
        expect(text).toContain('Content-Type: application/octet-stream');

        const metadata = {
          name: 'meal-planner-backup.sqlite',
          mimeType: 'application/octet-stream',
          parents: ['appDataFolder'],
        };
        expect(text).toContain(JSON.stringify(metadata));
      });

      it('throws on POST failure', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({ files: [] }));
        fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 503));

        await expect(uploadBackup(TOKEN, uploadData)).rejects.toThrow(
          'Drive upload failed: 503',
        );
      });
    });
  });

  describe('deleteBackup', () => {
    it('sends DELETE request with correct URL and auth header', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, true, 204));

      await deleteBackup(TOKEN, 'file-1');

      expect(fetchSpy).toHaveBeenCalledWith(`${DRIVE_API}/file-1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    });

    it('resolves successfully on ok response', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, true, 204));

      await expect(deleteBackup(TOKEN, 'file-1')).resolves.toBeUndefined();
    });

    it('ignores 404 response without throwing', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 404));

      await expect(deleteBackup(TOKEN, 'file-1')).resolves.toBeUndefined();
    });

    it('throws on non-ok non-404 response', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse(null, false, 500));

      await expect(deleteBackup(TOKEN, 'file-1')).rejects.toThrow(
        'Drive delete failed: 500',
      );
    });
  });
});

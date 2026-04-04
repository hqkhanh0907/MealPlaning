import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { DatabaseProvider, useDatabase } from '../contexts/DatabaseContext';

/* Mock createDatabaseService so we don't need real sql.js WASM */
const mockInitialize = vi.fn();
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockService = {
  initialize: mockInitialize,
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn().mockResolvedValue(undefined),
  close: mockClose,
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../services/databaseService', () => ({
  createDatabaseService: () => mockService,
}));

vi.mock('../services/schema', () => ({
  createSchema: vi.fn().mockResolvedValue(undefined),
  getSchemaVersion: vi.fn().mockResolvedValue(0),
  runSchemaMigrations: vi.fn().mockResolvedValue(undefined),
}));

describe('DatabaseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockInitialize.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('renders children after initialization', async () => {
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('shows error state on initialization failure', async () => {
    mockInitialize.mockRejectedValue(new Error('WASM load failed'));

    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/WASM load failed/)).toBeInTheDocument();
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('shows error state when initialization rejects with non-Error', async () => {
    mockInitialize.mockRejectedValue('string error');

    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/string error/)).toBeInTheDocument();
  });

  it('useDatabase() returns database service inside provider', async () => {
    mockInitialize.mockResolvedValue(undefined);

    function TestConsumer() {
      const db = useDatabase();
      return <div data-testid="has-db">{db ? 'yes' : 'no'}</div>;
    }

    render(
      <DatabaseProvider>
        <TestConsumer />
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-db')).toHaveTextContent('yes');
    });
  });

  it('useDatabase() throws outside provider', () => {
    const spy = vi.spyOn(globalThis.console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDatabase());
    }).toThrow('useDatabase must be used within DatabaseProvider');

    spy.mockRestore();
  });

  it('calls runSchemaMigrations when version > 0 (existing DB)', async () => {
    const { getSchemaVersion, runSchemaMigrations } = await import('../services/schema');
    vi.mocked(getSchemaVersion).mockResolvedValue(3);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(runSchemaMigrations).toHaveBeenCalledWith(mockService);
  });

  it('skips runSchemaMigrations when version = 0 (fresh DB)', async () => {
    const { getSchemaVersion, runSchemaMigrations } = await import('../services/schema');
    vi.mocked(getSchemaVersion).mockResolvedValue(0);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(runSchemaMigrations).not.toHaveBeenCalled();
  });

  it('calls close() on unmount cleanup', async () => {
    mockInitialize.mockResolvedValue(undefined);
    mockClose.mockClear();

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    unmount();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});

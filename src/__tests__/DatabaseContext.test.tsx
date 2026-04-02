import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { DatabaseProvider, useDatabase } from '../contexts/DatabaseContext';

/* Mock createDatabaseService so we don't need real sql.js WASM */
const mockInitialize = vi.fn();
const mockService = {
  initialize: mockInitialize,
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  transaction: vi.fn().mockResolvedValue(undefined),
  exportToJSON: vi.fn(),
  importFromJSON: vi.fn(),
};

vi.mock('../services/databaseService', () => ({
  createDatabaseService: () => mockService,
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
});

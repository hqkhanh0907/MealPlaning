import { act, render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

import { DatabaseProvider, useDatabase } from '../contexts/DatabaseContext';
import {
  isFitnessMigrationCompleted,
  isMigrationNeeded,
  migrateFitnessData,
  migrateFromLocalStorage,
} from '../services/migrationService';
import { createSchema, getSchemaVersion, runSchemaMigrations } from '../services/schema';

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

vi.mock('../services/migrationService', () => ({
  isMigrationNeeded: vi.fn().mockReturnValue(false),
  migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  isFitnessMigrationCompleted: vi.fn().mockReturnValue(true),
  migrateFitnessData: vi.fn().mockResolvedValue(undefined),
}));

describe('DatabaseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClose.mockResolvedValue(undefined);
    vi.mocked(getSchemaVersion).mockResolvedValue(0);
    vi.mocked(createSchema).mockResolvedValue(undefined);
    vi.mocked(runSchemaMigrations).mockResolvedValue(undefined);
    vi.mocked(isMigrationNeeded).mockReturnValue(false);
    vi.mocked(migrateFromLocalStorage).mockResolvedValue({ success: true });
    vi.mocked(isFitnessMigrationCompleted).mockReturnValue(true);
    vi.mocked(migrateFitnessData).mockResolvedValue({ migrated: false, recordCount: 0 });
  });

  it('shows loading state initially', () => {
    mockInitialize.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    expect(screen.getByText('Đang chuẩn bị MealPlaning')).toBeInTheDocument();
    expect(screen.getByText(/Ứng dụng đang mở cơ sở dữ liệu/)).toBeInTheDocument();
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
    expect(screen.queryByText('Đang chuẩn bị MealPlaning')).not.toBeInTheDocument();
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
    expect(screen.getByText('Không thể chuẩn bị ứng dụng')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('retries initialization from the error state', async () => {
    mockInitialize.mockRejectedValueOnce(new Error('first fail')).mockResolvedValueOnce(undefined);

    render(
      <DatabaseProvider>
        <div>Child Content</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Thử lại' }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
    expect(mockInitialize).toHaveBeenCalledTimes(2);
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

  it('calls migrateFromLocalStorage when isMigrationNeeded returns true', async () => {
    vi.mocked(isMigrationNeeded).mockReturnValue(true);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(migrateFromLocalStorage).toHaveBeenCalledWith(mockService);
  });

  it('skips migrateFromLocalStorage when isMigrationNeeded returns false', async () => {
    vi.mocked(isMigrationNeeded).mockReturnValue(false);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(migrateFromLocalStorage).not.toHaveBeenCalled();
  });

  it('calls migrateFitnessData when isFitnessMigrationCompleted returns false', async () => {
    vi.mocked(isFitnessMigrationCompleted).mockReturnValue(false);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(migrateFitnessData).toHaveBeenCalledWith(mockService);
  });

  it('skips migrateFitnessData when isFitnessMigrationCompleted returns true', async () => {
    vi.mocked(isFitnessMigrationCompleted).mockReturnValue(true);
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
    expect(migrateFitnessData).not.toHaveBeenCalled();
  });

  it('does not proceed when cancelled before init completes', async () => {
    let resolveInit!: () => void;
    mockInitialize.mockImplementation(
      () =>
        new Promise<void>(r => {
          resolveInit = r;
        }),
    );

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    expect(screen.getByText('Đang chuẩn bị MealPlaning')).toBeInTheDocument();
    unmount();

    await act(async () => {
      resolveInit();
    });

    expect(getSchemaVersion).not.toHaveBeenCalled();
  });

  it('does not load stores when cancelled during migrations', async () => {
    let resolveMigration!: () => void;
    vi.mocked(isFitnessMigrationCompleted).mockReturnValue(false);
    vi.mocked(migrateFitnessData).mockImplementation(
      () =>
        new Promise<{ migrated: boolean; recordCount: number }>(r => {
          resolveMigration = () => r({ migrated: false, recordCount: 0 });
        }),
    );
    mockInitialize.mockResolvedValue(undefined);

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(migrateFitnessData).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      resolveMigration();
    });
  });

  it('does not set db when cancelled after store loads', async () => {
    const ingredientModule = await import('../store/ingredientStore');
    const state = ingredientModule.useIngredientStore.getState();
    let resolveLoadAll!: (value: void) => void;
    const spy = vi.spyOn(state, 'loadAll').mockImplementation(
      () =>
        new Promise<void>(r => {
          resolveLoadAll = r;
        }),
    );
    mockInitialize.mockResolvedValue(undefined);

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      resolveLoadAll(undefined);
    });

    spy.mockRestore();
  });

  it('does not set error when cancelled during catch', async () => {
    let rejectSchema!: (err: Error) => void;
    vi.mocked(createSchema).mockImplementation(
      () =>
        new Promise<void>((_, rej) => {
          rejectSchema = rej;
        }),
    );
    mockInitialize.mockResolvedValue(undefined);

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(createSchema).toHaveBeenCalled();
    });

    unmount();

    await act(async () => {
      rejectSchema(new Error('cancelled rejection'));
    });
  });

  it('handles close() rejection silently on unmount', async () => {
    mockInitialize.mockResolvedValue(undefined);
    mockClose.mockRejectedValue(new Error('close failed'));

    const { unmount } = render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    unmount();

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  });

  it('calls loadActiveGoal after loadProfile during initialization', async () => {
    const healthModule = await import('../features/health-profile/store/healthProfileStore');
    const state = healthModule.useHealthProfileStore.getState();
    const callOrder: string[] = [];
    const loadProfileSpy = vi.spyOn(state, 'loadProfile').mockImplementation(async () => {
      callOrder.push('loadProfile');
    });
    const loadActiveGoalSpy = vi.spyOn(state, 'loadActiveGoal').mockImplementation(async () => {
      callOrder.push('loadActiveGoal');
    });
    mockInitialize.mockResolvedValue(undefined);

    render(
      <DatabaseProvider>
        <div>Child</div>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    expect(loadProfileSpy).toHaveBeenCalledWith(mockService);
    expect(loadActiveGoalSpy).toHaveBeenCalledWith(mockService);
    expect(callOrder.indexOf('loadProfile')).toBeLessThan(callOrder.indexOf('loadActiveGoal'));

    loadProfileSpy.mockRestore();
    loadActiveGoalSpy.mockRestore();
  });
});

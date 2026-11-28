import { loadAccountRenderer } from './account-renderer';

export async function loadAccountPage() {
  try {
    await loadAccountRenderer();
  } catch {
    return (await import('../account.page')).default;
  }
  return (await import('./account.page')).default;
}

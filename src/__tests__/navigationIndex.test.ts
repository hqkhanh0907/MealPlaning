import { BottomNavBar, DesktopNav, getTabLabels, TabLoadingFallback } from '../components/navigation/index';

describe('navigation/index barrel exports', () => {
  it('re-exports BottomNavBar', () => {
    expect(BottomNavBar).toBeDefined();
  });

  it('re-exports DesktopNav', () => {
    expect(DesktopNav).toBeDefined();
  });

  it('re-exports TabLoadingFallback', () => {
    expect(TabLoadingFallback).toBeDefined();
  });

  it('re-exports getTabLabels', () => {
    expect(getTabLabels).toBeDefined();
    expect(typeof getTabLabels).toBe('function');
  });
});

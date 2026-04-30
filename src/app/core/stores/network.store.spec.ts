import { TestBed } from '@angular/core/testing';
import type { PluginListenerHandle } from '@capacitor/core';

import { NETWORK_PLUGIN, NetworkStore, type NetworkPluginLike } from './network.store';

describe('NetworkStore', () => {
  let store: NetworkStore;
  let getStatusSpy: jasmine.Spy;
  let addListenerSpy: jasmine.Spy;
  let removeSpy: jasmine.Spy;
  let listenerCallback: ((status: { connected: boolean }) => void) | undefined;

  beforeEach(() => {
    listenerCallback = undefined;
    removeSpy = jasmine.createSpy('remove').and.resolveTo();

    getStatusSpy = jasmine
      .createSpy('getStatus')
      .and.resolveTo({ connected: true, connectionType: 'wifi' });
    addListenerSpy = jasmine
      .createSpy('addListener')
      .and.callFake(async (_event: string, cb: (status: { connected: boolean }) => void) => {
        listenerCallback = cb;
        return { remove: removeSpy } as unknown as PluginListenerHandle;
      });

    const fakePlugin: NetworkPluginLike = {
      getStatus: getStatusSpy as unknown as NetworkPluginLike['getStatus'],
      addListener: addListenerSpy as unknown as NetworkPluginLike['addListener'],
    };

    TestBed.configureTestingModule({
      providers: [NetworkStore, { provide: NETWORK_PLUGIN, useValue: fakePlugin }],
    });
    store = TestBed.inject(NetworkStore);
  });

  afterEach(async () => {
    await store.stop();
  });

  it('seeds online from getStatus()', async () => {
    await store.start();
    expect(store.online()).toBe(true);
    expect(getStatusSpy).toHaveBeenCalledTimes(1);
  });

  it('updates signal when networkStatusChange fires', async () => {
    await store.start();
    expect(listenerCallback).toBeDefined();
    listenerCallback!({ connected: false });
    expect(store.online()).toBe(false);
    listenerCallback!({ connected: true });
    expect(store.online()).toBe(true);
  });

  it('start() is idempotent — second call does NOT add a second listener', async () => {
    await store.start();
    await store.start();
    expect(addListenerSpy).toHaveBeenCalledTimes(1);
  });

  it('stop() removes the listener', async () => {
    await store.start();
    await store.stop();
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to online=true when getStatus throws (web env)', async () => {
    getStatusSpy.and.rejectWith(new Error('not available'));
    await store.start();
    expect(store.online()).toBe(true);
  });
});

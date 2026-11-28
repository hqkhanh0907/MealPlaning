export interface LeptosModule {
  default(): Promise<unknown>;
}

let pending: Promise<LeptosModule> | undefined;

export function loadLeptosModule(): Promise<LeptosModule> {
  if (!pending) {
    const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
    pending = import(/* webpackIgnore: true */ /* @vite-ignore */ url.href)
      .then(async (module: LeptosModule) => {
        await module.default();
        return module;
      })
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
  }
  return pending;
}

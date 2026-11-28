interface AccountRenderer {
  default(): Promise<unknown>;
  mountAccount(
    host: HTMLElement,
    submit: (user: string, password: string, name?: string) => Promise<unknown>,
  ): { free(): void };
}

let ready: AccountRenderer | undefined;
let loading: Promise<AccountRenderer> | undefined;

export function loadAccountRenderer(): Promise<AccountRenderer> {
  if (!loading) {
    const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
    loading = import(/* webpackIgnore: true */ /* @vite-ignore */ url.href)
      .then(async (module: AccountRenderer) => {
        await module.default();
        if (typeof module.mountAccount !== 'function') throw new Error('Missing account form.');
        ready = module;
        return module;
      })
      .catch((error: unknown) => {
        loading = undefined;
        throw error;
      });
  }
  return loading;
}

export function accountRenderer(): AccountRenderer {
  if (!ready) throw new Error('Account form has not loaded.');
  return ready;
}

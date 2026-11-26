import { computed, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AccountSession, type AccountIdentity } from '../../account/account-session';

interface GroqStatus {
  readonly configured: boolean;
  readonly cancelled?: boolean;
}

interface OwnerOptions {
  readonly ownerId: string;
}

export interface NativeGroq {
  status(options: OwnerOptions): Promise<GroqStatus>;
  configure(options: OwnerOptions): Promise<GroqStatus>;
  clear(options: OwnerOptions): Promise<GroqStatus>;
  generate(
    options: OwnerOptions & { readonly payload: object; readonly timeoutMs: number },
  ): Promise<{ readonly status: number; readonly content?: string }>;
}

const bridge = registerPlugin<NativeGroq>('MealPlanGroq');

export const NATIVE_GROQ = new InjectionToken<NativeGroq>('Native Groq', {
  providedIn: 'root',
  // Angular inspects injected objects for methods that the Capacitor proxy would intercept.
  factory: () => ({
    status: (options) => bridge.status(options),
    configure: (options) => bridge.configure(options),
    clear: (options) => bridge.clear(options),
    generate: (options) => bridge.generate(options),
  }),
});

const nativeErrorMessages = {
  groq_no_session: 'Đăng nhập để dùng Groq.',
  groq_session_changed: 'Tài khoản đã thay đổi. Hãy thử lại.',
  groq_not_configured: 'Thêm khóa Groq trong Cài đặt, mục AI.',
  groq_timeout: 'Groq mất quá nhiều thời gian để phản hồi. Hãy thử lại.',
  groq_unavailable: 'Không kết nối được với Groq. Hãy kiểm tra mạng.',
  groq_invalid_response: 'Groq trả về kết quả không hợp lệ. Hãy thử lại.',
  groq_invalid_request: 'Chưa thể gửi yêu cầu tới Groq. Hãy thử lại.',
} as const;

type NativeGroqCode = keyof typeof nativeErrorMessages;

export class NativeGroqError extends Error {
  constructor(readonly code: NativeGroqCode) {
    super(nativeErrorMessages[code]);
  }
}

export function nativeGroqError(error: unknown): NativeGroqError {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string' && Object.hasOwn(nativeErrorMessages, code)) {
      return new NativeGroqError(code as NativeGroqCode);
    }
  }
  return new NativeGroqError('groq_unavailable');
}

@Injectable({ providedIn: 'root' })
export class GroqCredentials {
  private readonly account = inject(AccountSession);
  private readonly native = inject(NATIVE_GROQ);
  private readonly configuredFor = signal<AccountIdentity | null>(null);
  private pendingAccount: AccountIdentity | null = null;
  private request = 0;
  readonly supported = Capacitor.getPlatform() === 'android';
  readonly configured = computed(() => {
    const account = this.account.current();
    return account !== null && this.configuredFor() === account;
  });

  constructor() {
    if (this.supported) effect(() => void this.refresh());
  }

  async refresh(): Promise<void> {
    const account = this.account.current();
    if (!this.supported || !account || this.pendingAccount === account) return;
    const request = ++this.request;
    try {
      const { configured } = await this.native.status({ ownerId: account.id });
      this.applyStatus(account, request, configured);
    } catch {
      this.applyStatus(account, request, false);
    }
  }

  configure(): Promise<boolean> {
    return this.change('configure');
  }

  async remove(): Promise<void> {
    await this.change('clear');
  }

  private async change(method: 'configure' | 'clear'): Promise<boolean> {
    if (!this.supported) throw new NativeGroqError('groq_unavailable');
    const account = this.account.current();
    if (!account) throw new NativeGroqError('groq_no_session');
    if (this.pendingAccount === account) return false;
    const request = ++this.request;
    this.pendingAccount = account;
    try {
      const { configured, cancelled } = await this.native[method]({ ownerId: account.id });
      return this.applyStatus(account, request, configured) && configured && !cancelled;
    } catch (error) {
      if (this.account.current() !== account) return false;
      throw nativeGroqError(error);
    } finally {
      if (this.pendingAccount === account) this.pendingAccount = null;
    }
  }

  private applyStatus(account: AccountIdentity, request: number, configured: boolean): boolean {
    if (this.account.current() !== account || this.request !== request) return false;
    this.configuredFor.set(configured ? account : null);
    return true;
  }
}

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GROQ_API_KEY } from '../core/services/ai/groq-client';
import { GEMINI_API_KEY } from '../core/services/ai/gemini-key';
import { NetworkStore } from '../core/stores/network.store';
import { AiAvailability } from './ai-availability';

describe('AI action availability', () => {
  it('restores only the configured actions after going online', () => {
    const online = signal(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: NetworkStore, useValue: { online } },
        { provide: GROQ_API_KEY, useValue: '' },
        { provide: GEMINI_API_KEY, useValue: 'synthetic' },
      ],
    });
    const ai = TestBed.inject(AiAvailability);
    expect(ai.textIssue()).toContain('kết nối mạng');
    expect(ai.photoIssue()).toContain('kết nối mạng');
    online.set(true);
    expect(ai.textIssue()).toBeNull();
    expect(ai.photoIssue()).toContain('khóa Groq');
  });
});

import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepLayoutProps {
  title: string;
  subtitle: string;
  goNext: () => void;
  goBack: () => void;
  children: React.ReactNode;
}

export function StepLayout({ title, subtitle, goNext, goBack, children }: Readonly<StepLayoutProps>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <h2 className="mb-1 text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        {children}
      </div>
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-500 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-400"
        >
          {t('onboarding.nav.back')}
        </button>
        <Button
          onClick={goNext}
          className="min-h-[44px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          {t('onboarding.nav.next')}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

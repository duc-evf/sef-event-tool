import SettingsPanel from './SettingsPanel';
import WikiDialog from './WikiDialog';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AppShell({ mode, onModeChange, children, onClearData, lastSaved }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-gradient-to-r from-[oklch(0.38_0.09_185)] to-[oklch(0.45_0.1_185)] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/sef-logo.png"
                alt="SEF"
                className="h-10 rounded"
              />
              <div className="hidden sm:block h-8 w-px bg-white/30" />
              <span className="hidden sm:block text-white/90 text-sm font-medium tracking-wide">
                Event Tool
              </span>
            </div>
            <nav className="flex gap-1 ml-2">
              <button
                onClick={() => onModeChange('input')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  mode === 'input'
                    ? 'bg-white text-[oklch(0.35_0.09_185)] shadow-sm'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                )}
              >
                Individual Input
              </button>
              <button
                onClick={() => onModeChange('consolidate')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  mode === 'consolidate'
                    ? 'bg-white text-[oklch(0.35_0.09_185)] shadow-sm'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                )}
              >
                Consolidation
              </button>
              <button
                onClick={() => onModeChange('stakeholders')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  mode === 'stakeholders'
                    ? 'bg-white text-[oklch(0.35_0.09_185)] shadow-sm'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                )}
              >
                Stakeholders
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-white/60">
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  title="Start a new session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/15 hover:text-white transition-all border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Session
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a new session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear all current data — event info, contacts, requirements, and report — from this browser. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, clear everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <WikiDialog />
            <SettingsPanel onClearData={onClearData} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

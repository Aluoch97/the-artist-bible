import { Component, type ErrorInfo, type ReactNode } from 'react';
import { industryData } from '../../data';
import { STORAGE_KEY } from '../../hooks/useLocalProgress';
import { buttonVariants } from '../ui/button';

interface Props {
  children: ReactNode;
  /** Changing this (e.g. the route) clears a previous error. */
  resetKey?: string;
}
interface State {
  error: Error | null;
  confirmReset: boolean;
}

/**
 * Catches screen crashes so people never get a blank page. Nothing is sent anywhere automatically:
 * the "Report a problem" button just opens a pre-filled GitHub issue the person can edit or discard.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, confirmReset: false };

  static getDerivedStateFromError(error: Error): State {
    return { error, confirmReset: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Screen crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null, confirmReset: false });
  }

  private issueUrl(): string {
    const u = new URL(`${industryData.site.githubRepo}/issues/new`);
    u.searchParams.set('title', 'App crashed on a screen');
    u.searchParams.set('labels', 'bug');
    u.searchParams.set(
      'body',
      `Screen: ${window.location.pathname}\nError: ${this.state.error?.message ?? 'unknown'}\nBrowser: ${navigator.userAgent}\n\nWhat were you doing?\n`,
    );
    return u.toString();
  }

  private eraseAndReload = (): void => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable: reload anyway */
    }
    window.location.assign('/');
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <section role="alert" className="py-10 text-center">
        <h1 className="font-display text-3xl font-bold">Something went wrong on this screen</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted">Your saved work is safe on this device. Try reloading. If it keeps happening, tell us and we will fix it.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className={buttonVariants({ variant: 'primary' })} onClick={() => window.location.reload()}>Reload</button>
          <a className={buttonVariants({ variant: 'secondary' })} href="/">Go home</a>
          <a className={buttonVariants({ variant: 'secondary' })} href={this.issueUrl()} target="_blank" rel="noopener noreferrer">Report a problem</a>
        </div>
        <div className="mt-8">
          {this.state.confirmReset ? (
            <p className="text-sm text-warn">
              This erases everything saved in the app on this device (backup first if you can).{' '}
              <button type="button" className="cursor-pointer font-bold underline" onClick={this.eraseAndReload}>Yes, erase and restart</button>
            </p>
          ) : (
            <button type="button" className="min-h-11 cursor-pointer text-sm text-muted underline" onClick={() => this.setState({ confirmReset: true })}>
              Still broken? Erase saved data and restart
            </button>
          )}
        </div>
      </section>
    );
  }
}

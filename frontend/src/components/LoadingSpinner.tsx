interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="loading-state">
      <div className={`loading-spinner ${size === 'sm' ? 'loading-spinner--sm' : ''}`} role="status" aria-label="Loading" />
      {message && <span>{message}</span>}
    </div>
  );
}

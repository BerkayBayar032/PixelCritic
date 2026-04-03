import { Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-surface border border-border">
          <Gamepad2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="font-display text-7xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="font-display text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-text-muted max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved. Maybe it's in another castle?
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

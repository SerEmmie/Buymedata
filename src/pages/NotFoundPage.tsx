import React from 'react';
import { Link } from '../router';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900">404 — Page Not Found</h1>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        The link you followed may be broken or the creator page may have moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F22550] text-white font-bold text-xs rounded-xl hover:bg-[#D81A43]"
        >
          <Home className="w-3.5 h-3.5" /> Return to Home
        </Link>
      </div>
    </div>
  );
}

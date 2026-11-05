import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RouterContextType {
  pathname: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
  search: string;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  navigate: () => {},
  params: {},
  search: '',
});

export function useRouter() {
  return useContext(RouterContext);
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useLocation() {
  const { pathname, search, params } = useContext(RouterContext);
  return { pathname, search, params };
}

/**
 * Detects the repository base path if hosted on GitHub Pages or a subdirectory.
 * e.g., https://username.github.io/my-repo/ -> returns "/my-repo"
 */
export function getRepoBasePath(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.endsWith('github.io')) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return `/${segments[0]}`;
    }
  }
  return '';
}

/**
 * Normalizes the current URL path across root domains, GitHub Pages subdirectories, and hash routes.
 */
export function getCurrentNormalizedPath(): string {
  if (typeof window === 'undefined') return '/';

  // 1. Prioritize hash routing if present (#/path or #path)
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, '/');
    const [hashPath] = rawHash.split('?');
    if (hashPath) {
      return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
    }
  }

  // 2. Normalize pathname
  let rawPath = window.location.pathname || '/';

  // Strip GitHub Pages repository prefix
  const basePath = getRepoBasePath();
  if (basePath && rawPath.startsWith(basePath)) {
    rawPath = rawPath.slice(basePath.length) || '/';
  }

  // Strip index.html if present
  if (rawPath.endsWith('/index.html')) {
    rawPath = rawPath.slice(0, -11) || '/';
  } else if (rawPath === '/index.html') {
    rawPath = '/';
  }

  // Strip trailing slash unless it's the root '/'
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    rawPath = rawPath.slice(0, -1);
  }

  return rawPath || '/';
}

export function useParams<T extends Record<string, string>>(): T {
  const { pathname, params: contextParams } = useContext(RouterContext);

  const resolvedParams: Record<string, string> = { ...contextParams };
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 3 && parts[1] === 'campaigns') {
    // /:username/campaigns/:campaignSlug
    resolvedParams.username = decodeURIComponent(parts[0]);
    resolvedParams.campaignSlug = decodeURIComponent(parts[2]);
  } else if (parts.length === 3 && parts[0] === 'dashboard' && parts[1] === 'campaigns') {
    // /dashboard/campaigns/:id
    resolvedParams.id = decodeURIComponent(parts[2]);
  } else if (parts.length === 1) {
    const reserved = [
      'dashboard',
      'admin',
      'auth',
      'onboarding',
      'how-it-works',
      'about',
      'faq',
      'terms',
      'privacy',
      'refund-policy',
      'guidelines',
    ];
    if (!reserved.includes(parts[0].toLowerCase())) {
      resolvedParams.username = decodeURIComponent(parts[0]);
    }
  }

  return resolvedParams as T;
}

export function Link({
  to,
  children,
  className = '',
  onClick,
  ...props
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: unknown;
}) {
  const { navigate } = useRouter();
  const basePath = getRepoBasePath();
  const isExternal = to.startsWith('http://') || to.startsWith('https://') || to.startsWith('mailto:');
  const href = isExternal ? to : `${basePath}${to}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    if (isExternal) return;

    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

export function matchPath(pattern: string, pathname: string): { matches: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathnameParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathnameParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathnameParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart.toLowerCase() !== pathPart.toLowerCase()) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(getCurrentNormalizedPath);
  const [search, setSearch] = useState(window.location.search || '');
  const [params] = useState<Record<string, string>>({});

  const navigate = (to: string) => {
    const [newPath, newSearch = ''] = to.split('?');
    const basePath = getRepoBasePath();
    const fullTarget = `${basePath}${newPath}${newSearch ? `?${newSearch}` : ''}`;

    if (newPath !== pathname || (newSearch && newSearch !== search)) {
      window.history.pushState({}, '', fullTarget);
      setPathname(newPath || '/');
      setSearch(newSearch ? `?${newSearch}` : '');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setPathname(getCurrentNormalizedPath());
      setSearch(window.location.search || '');
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate, params, search }}>
      {children}
    </RouterContext.Provider>
  );
}

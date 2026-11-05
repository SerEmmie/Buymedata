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

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

interface RouteMatch {
  pattern: string;
  component: React.ComponentType;
  params: Record<string, string>;
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
  const [pathname, setPathname] = useState(window.location.pathname || '/');
  const [search, setSearch] = useState(window.location.search || '');
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = (to: string) => {
    const [newPath, newSearch = ''] = to.split('?');
    if (newPath !== pathname || (newSearch && newSearch !== search)) {
      window.history.pushState({}, '', to);
      setPathname(newPath || '/');
      setSearch(newSearch ? `?${newSearch}` : '');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/');
      setSearch(window.location.search || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate, params, search }}>
      {children}
    </RouterContext.Provider>
  );
}

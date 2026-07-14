import React from 'react';
import { 
  createNavigationContainerRef,
  StackActions
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function useNavigate() {
  return React.useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (!navigationRef.isReady()) return;

    if (typeof to === 'number') {
      if (to === -1 && navigationRef.canGoBack()) {
        navigationRef.goBack();
      }
      return;
    }

    if (typeof to !== 'string' || !to) return;

    let path = to;
    let params: any = {};
    
    // Parse query params (e.g. /meetings?joinCode=123)
    if (path.includes('?')) {
      const [p, q] = path.split('?');
      path = p;
      // manual simple parse for RN if URLSearchParams not available
      q.split('&').forEach(part => {
        const [k, v] = part.split('=');
        if (k) params[k] = decodeURIComponent(v || '');
      });
    }

    let screenName = 'Home';
    if (path.startsWith('/')) path = path.slice(1);
    
    // Map paths to Screen names
    if (path === 'login') screenName = 'Login';
    else if (path === 'home' || path === '') screenName = 'Home';
    else if (path === 'mail') screenName = 'Mail';
    else if (path === 'chat') screenName = 'Chat';
    else if (path === 'meetings') screenName = 'Meetings';
    else if (path === 'docs') screenName = 'Docs';
    else if (path === 'sheets') screenName = 'Sheets';
    else if (path === 'show') screenName = 'Show';
    else if (path === 'settings') screenName = 'Settings';
    else if (path === 'team') screenName = 'TeamManagement';
    else if (path === 'superadmin') screenName = 'SuperAdminDashboard';

    if (options?.replace) {
      navigationRef.dispatch(StackActions.replace(screenName, params));
    } else {
      navigationRef.navigate(screenName, params);
    }
  }, []);
}

export function useLocation() {
  const [pathname, setPathname] = React.useState('/login');
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!navigationRef.isReady()) return;
    
    const updateLocation = () => {
      const route = navigationRef.getCurrentRoute();
      if (route) {
        let p = '/' + route.name.toLowerCase();
        if (route.name === 'TeamManagement') p = '/team';
        if (route.name === 'SuperAdminDashboard') p = '/superadmin';
        setPathname(p);
        
        if (route.params) {
          const qs = Object.entries(route.params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
          setSearch(qs ? '?' + qs : '');
        } else {
          setSearch('');
        }
      }
    };
    
    updateLocation();
    const unsubscribe = navigationRef.addListener('state', updateLocation);
    return unsubscribe;
  }, []);

  return { pathname, search };
}

// These are stubbed out since we will use React Navigation's Stack.Navigator directly in App.tsx
export function BrowserRouter({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Routes({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Route(props: any) { return null; }
export function Outlet() { return null; }

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
}

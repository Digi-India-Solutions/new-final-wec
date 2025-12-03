// import { BrowserRouter, useRoutes, useLocation, useNavigate } from 'react-router-dom';
// import { useEffect, useState, useCallback } from 'react';
// import routes from './router/config';
// import Sidebar from './components/layout/Sidebar';
// import Header from './components/layout/Header';
// import { jwtDecode } from 'jwt-decode';

// // Type for user (adjust based on your JWT structure)

// function AppContent() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const routing = useRoutes(routes);

//   const [isAuthenticated, setIsAuthenticated] = useState(
//     sessionStorage.getItem('isAuthenticated') === 'true'
//   );

//   const [user, setUser] = useState(() => {
//     const storedUser = sessionStorage.getItem('user');
//     return storedUser ? JSON.parse(storedUser) : null;
//   });

//   const [activeMenuKey, setActiveMenuKey] = useState('dashboard');

//   /** 🔄 Sync navigation globally (for legacy usage) */
//   useEffect(() => {
//     window.REACT_APP_NAVIGATE = navigate;
//   }, [navigate]);

//   /** 🔑 Handle Authentication + Redirection Logic */
//   useEffect(() => {
//     const token = sessionStorage.getItem('token');

//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser(decoded);
//         sessionStorage.setItem('user', JSON.stringify(decoded));
//         setIsAuthenticated(true);

//         // Optional: Token expiry check
//         if (decoded.exp && Date.now() >= decoded.exp * 1000) {
//           console.warn('Token expired');
//           sessionStorage.clear();
//           setIsAuthenticated(false);
//           navigate('/');
//         }
//       } catch (err) {
//         console.warn('Invalid token:', err);
//         sessionStorage.clear();
//         setIsAuthenticated(false);
//         navigate('/');
//       }
//     } else {
//       setIsAuthenticated(false);
//     }

//     // Redirect logic
//     if (!isAuthenticated && location.pathname !== '/' && location.pathname !== '/login' ) {
//       navigate('/');
//     } else if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login')) {
//       navigate('/dashboard');
//     }
//   }, [isAuthenticated, location.pathname, navigate]);

//   /** 📍 Menu Highlight Logic */
//   useEffect(() => {
//     const pathToKeyMap = {
//       '/dashboard': 'dashboard',
//       '/users': 'users',
//       '/distributors': 'users',
//       '/retailers': 'users',
//       '/products': 'products',
//       '/amcs': 'amcs',
//       '/customers': 'customers',
//       '/wallet': 'wallet',
//       '/reports': 'reports',
//       '/settings': 'settings',
//     };

//     const matchedKey =
//       Object.entries(pathToKeyMap).find(([path]) => location.pathname.startsWith(path))?.[1] ??
//       'dashboard';

//     setActiveMenuKey(matchedKey);
//   }, [location.pathname]);

//   /** 🧭 Handle Sidebar Menu Clicks */
//   const handleMenuClick = useCallback(
//     (key, path) => {
//       setActiveMenuKey(key);
//       navigate(path);
//     },
//     [navigate]
//   );

//   /** 🧱 Conditional Layout Rendering */
//   const isLoginPage = location.pathname === '/' || location.pathname === '/login';

//   if (!isAuthenticated && isLoginPage) {
//     return <div className="min-h-screen bg-gray-50">{routing}</div>;
//   }

//   if (!isAuthenticated && !isLoginPage) {
//     return null; // prevents flashing while redirecting
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       <Sidebar activeKey={activeMenuKey} onMenuClick={handleMenuClick} />
//       <div className="flex-1 flex flex-col">
//         <Header user={user} />
//         <main className="flex-1 overflow-auto p-4">{routing}</main>
//       </div>
//     </div>
//   );
// }

// /** 🌍 App Root */
// function App() {
//   // Replace with your actual base path constant or string if needed
//   const basePath = (window).__BASE_PATH__ || '/';

//   return (
//     <BrowserRouter basename={basePath}>
//       <AppContent />
//     </BrowserRouter>
//   );
// }

// export default App;

// import { BrowserRouter, useRoutes, useLocation, useNavigate } from 'react-router-dom';
// import { useEffect, useState, useCallback } from 'react';
// import routes from './router/config';
// import Sidebar from './components/layout/Sidebar';
// import Header from './components/layout/Header';
// import { jwtDecode } from 'jwt-decode';

// function AppContent() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const routing = useRoutes(routes);

//   const [isAuthenticated, setIsAuthenticated] = useState(
//     sessionStorage.getItem('isAuthenticated') === 'true'
//   );
//   const [user, setUser] = useState(() => {
//     const storedUser = sessionStorage.getItem('user');
//     return storedUser ? JSON.parse(storedUser) : null;
//   });
//   const [activeMenuKey, setActiveMenuKey] = useState('dashboard');

//   /** 🔄 Make navigate globally available if needed */
//   useEffect(() => {
//     window.REACT_APP_NAVIGATE = navigate;
//   }, [navigate]);

//   /** 🔑 Handle Authentication + Redirection Logic */
//   useEffect(() => {
//     const token = sessionStorage.getItem('token');
//     const publicRoutes = ['/', '/login', '/admin/reset-password']; // allowed unauthenticated routes

//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         const isExpired = decoded.exp && Date.now() >= decoded.exp * 1000;

//         if (isExpired) {
//           console.warn('Token expired');
//           sessionStorage.clear();
//           setIsAuthenticated(false);
//           navigate('/login', { replace: true });
//           return;
//         }

//         setUser(decoded);
//         setIsAuthenticated(true);
//         sessionStorage.setItem('user', JSON.stringify(decoded));
//       } catch (err) {
//         console.warn('Invalid token:', err);
//         sessionStorage.clear();
//         setIsAuthenticated(false);
//         navigate('/login', { replace: true });
//         return;
//       }
//     } else {
//       setIsAuthenticated(false);
//     }

//     // Redirect logic
//     const isPublic = publicRoutes.some((route) =>
//       location.pathname.startsWith(route)
//     );

//     if (!isAuthenticated && !isPublic) {
//       navigate('/login', { replace: true });
//     } else if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login')) {
//       navigate('/dashboard', { replace: true });
//     }
//   }, [isAuthenticated, location.pathname, navigate]);

//   /** 📍 Active Menu Highlight */
//   useEffect(() => {
//     const pathToKeyMap = {
//       '/dashboard': 'dashboard',
//       '/users': 'users',
//       '/distributors': 'users',
//       '/retailers': 'users',
//       '/products': 'products',
//       '/amcs': 'amcs',
//       '/customers': 'customers',
//       '/wallet': 'wallet',
//       '/reports': 'reports',
//       '/settings': 'settings',
//       '/staff': 'staff',
//       '/claims': 'claims',
//     };

//     const matchedKey =
//       Object.entries(pathToKeyMap).find(([path]) =>
//         location.pathname.startsWith(path)
//       )?.[1] ?? 'dashboard';

//     setActiveMenuKey(matchedKey);
//   }, [location.pathname]);

//   /** 🧭 Handle Sidebar Menu Clicks */
//   const handleMenuClick = useCallback(
//     (key, path) => {
//       setActiveMenuKey(key);
//       navigate(path);
//     },
//     [navigate]
//   );

//   /** 🧱 Layout Rendering */
//   const isLoginPage =
//     location.pathname === '/' ||
//     location.pathname === '/login' ||
//     location.pathname.startsWith('/admin/reset-password');

//   // Show login/reset pages without layout
//   if (isLoginPage) {
//     return <div className="min-h-screen bg-gray-50">{routing}</div>;
//   }

//   // Prevent flicker while redirecting unauthenticated user
//   if (!isAuthenticated) {
//     return null
//   }

//   // Authenticated layout
//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       <Sidebar activeKey={activeMenuKey} onMenuClick={handleMenuClick} />
//       <div className="flex-1 flex flex-col">
//         <Header user={user} />
//         <main className="flex-1 overflow-auto p-4">{routing}</main>
//       </div>
//     </div>
//   );
// }

// /** 🌍 Root App Wrapper */
// function App() {
//   const basePath = window.__BASE_PATH__ || '/';

//   return (
//     <BrowserRouter basename={basePath}>
//       <AppContent />
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, useRoutes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import routes from './router/config';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { jwtDecode } from 'jwt-decode';
import { clsx } from 'clsx';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const routing = useRoutes(routes);

  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [activeMenuKey, setActiveMenuKey] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** 🔄 Make navigate globally available if needed */
  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
  }, [navigate]);

  /** 🔑 Authentication + Route Access Handling */
  useEffect(() => {
    const token = sessionStorage.getItem('token');

    // ✅ Allow login, root, forgot password, and reset-password/:token without auth
    const isResetPasswordRoute = /^\/admin\/reset-password(\/[^/]+)?$/.test(location.pathname);
    const publicRoutes = ['/', '/login', '/forgot-password'];

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp && Date.now() >= decoded.exp * 1000;

        if (isExpired) {
          console.warn('Token expired');
          sessionStorage.clear();
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
          return;
        }

        setUser(decoded);
        setIsAuthenticated(true);
        sessionStorage.setItem('user', JSON.stringify(decoded));
      } catch (err) {
        console.warn('Invalid token:', err);
        sessionStorage.clear();
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }
    } else {
      setIsAuthenticated(false);
    }

    // 🚦 Redirect logic
    const isPublic =
      publicRoutes.includes(location.pathname) || isResetPasswordRoute;

    if (!isAuthenticated && !isPublic) {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  /** 📍 Sidebar Active Menu Key */
  useEffect(() => {
    const pathToKeyMap = {
      '/dashboard': 'dashboard',
      '/users': 'users',
      '/distributors': 'users',
      '/retailers': 'users',
      '/products': 'products',
      '/amcs': 'amcs',
      '/customers': 'customers',
      '/wallet': 'wallet',
      '/reports': 'reports',
      '/settings': 'settings',
      '/staff': 'staff',
      '/claims': 'claims',
      '/alladmin': 'alladmin',
    };

    const matchedKey =
      Object.entries(pathToKeyMap).find(([path]) =>
        location.pathname.startsWith(path)
      )?.[1] ?? 'dashboard';

    setActiveMenuKey(matchedKey);
  }, [location.pathname]);

  /** 🧭 Handle Sidebar Navigation */
  const handleMenuClick = useCallback(
    (key, path) => {
      setActiveMenuKey(key);
      navigate(path);
      setSidebarOpen(false); // Close sidebar on mobile after navigation
    },
    [navigate]
  );

  /** 📱 Toggle sidebar for mobile */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  /** 🧱 Layout Rendering */
  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    /^\/admin\/reset-password(\/[^/]+)?$/.test(location.pathname);

  // Show public pages without sidebar/header
  if (isPublicPage) {
    return <div className="min-h-screen bg-gray-50">{routing}</div>;
  }

  // 🧤 Redirect to login if unauthenticated
  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  // Authenticated Layout
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed position, hidden on mobile, shown on md+ */}
      <div className={clsx(
        'sidebar-mobile md:relative md:transform-none md:flex md:flex-shrink-0',
        sidebarOpen ? 'open' : ''
      )}>
        <Sidebar activeKey={activeMenuKey} onMenuClick={handleMenuClick} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area - scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onMenuToggle={toggleSidebar} />
        <main className="flex-1 overflow-auto p-2 sm:p-4">
          <div className="dashboard-scale">
            {routing}
          </div>
        </main>
      </div>
    </div>
  );
}

/** 🌍 Root App Wrapper */
function App() {
  const basePath = window.__BASE_PATH__ || '/';

  return (
    <BrowserRouter basename={basePath}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

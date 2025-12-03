
// // import { useAuthStore } from '../../store/authStore';
// // import { clsx } from 'clsx';

// // const menuItems = [
// //   { key: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/dashboard', roles: ['admin', 'distributor', 'retailer'] },
// //   { key: 'users', label: 'User Management', icon: 'ri-user-line', path: '/users', roles: ['admin', 'distributor'] },
// //   { key: 'staff', label: 'Staff Management', icon: 'ri-team-line', path: '/staff', roles: ['admin'] },
// //   { key: 'claims', label: 'Claims Management', icon: 'ri-file-shield-line', path: '/claims', roles: ['admin'] },
// //   { key: 'products', label: 'Products', icon: 'ri-product-hunt-line', path: '/products', roles: ['admin'] },
// //   { key: 'amcs', label: 'AMC Management', icon: 'ri-file-shield-line', path: '/amcs', roles: ['admin', 'distributor', 'retailer'] },
// //   { key: 'customers', label: 'Customers', icon: 'ri-user-heart-line', path: '/customers', roles: ['admin', 'distributor', 'retailer'] },
// //   { key: 'wallet', label: 'Wallet', icon: 'ri-wallet-line', path: '/wallet', roles: ['admin', 'distributor', 'retailer'] },
// //   { key: 'reports', label: 'Reports', icon: 'ri-bar-chart-line', path: '/reports', roles: ['admin', 'distributor'] },
// //   { key: 'settings', label: 'Settings', icon: 'ri-settings-line', path: '/settings', roles: ['admin'] },
// // ];

// // export default function Sidebar({ activeKey, onMenuClick }) {
// //   const { user } = useAuthStore();

// //   const filteredMenuItems = menuItems.filter(item => 
// //     user && item.roles.includes(user.role)
// //   );

// //   return (
// //     <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
// //       <div className="p-6 border-b border-gray-700">
// //         <h1 className="text-xl font-bold">AMC Management</h1>
// //         <p className="text-sm text-gray-400 capitalize">{user?.role} Panel</p>
// //       </div>

// //       <nav className="flex-1 p-4">
// //         <ul className="space-y-2">
// //           {filteredMenuItems.map((item) => (
// //             <li key={item.key}>
// //               <button
// //                 onClick={() => onMenuClick(item.key, item.path)}
// //                 className={clsx(
// //                   'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors cursor-pointer',
// //                   activeKey === item.key
// //                     ? 'bg-blue-600 text-white'
// //                     : 'text-gray-300 hover:bg-gray-800 hover:text-white'
// //                 )}
// //               >
// //                 <i className={`${item.icon} mr-3 w-5 h-5 flex items-center justify-center`}></i>
// //                 <span>{item.label}</span>
// //               </button>
// //             </li>
// //           ))}
// //         </ul>
// //       </nav>

// //       <div className="p-4 border-t border-gray-700">
// //         <div className="flex items-center space-x-3 mb-4">
// //           <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
// //             <i className="ri-user-line w-5 h-5 flex items-center justify-center"></i>
// //           </div>
// //           <div>
// //             <p className="font-medium">{user?.name}</p>
// //             <p className="text-sm text-gray-400">{user?.email}</p>
// //           </div>
// //         </div>
// //         <button
// //           onClick={() => useAuthStore.getState().logout()}
// //           className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer"
// //         >
// //           <i className="ri-logout-box-line mr-3 w-5 h-5 flex items-center justify-center"></i>
// //           <span>Logout</span>
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }



// import { useEffect, useState } from 'react';
// // import { useAuthStore } from '../../store/authStore';
// import { clsx } from 'clsx';
// import { useNavigate } from 'react-router-dom';
// import { getData } from '../../services/FetchNodeServices';



// export default function Sidebar({ activeKey, onMenuClick }) {
//   // const { user } = useAuthStore();
//   const navigate = useNavigate();
//   const [isAuthenticated, setIsAuthenticated] = useState(
//     sessionStorage.getItem('isAuthenticated') === 'true'
//   );

//   const [user, setUser] = useState(() => {
//     const storedUser = sessionStorage.getItem('user');
//     return storedUser ? JSON.parse(storedUser) : null;
//   });
//   const [allRoles, setAllRoles] = useState([]);
//   const [role, setRole] = useState([]);

//   const menuItems = [
//     { key: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/dashboard', roles: ['admin', 'Support Manager', 'distributor', 'retailer'] },
//     { key: 'users', label: 'User Management', icon: 'ri-user-line', path: '/users', roles: ['admin', 'distributor'] },
//     { key: 'staff', label: 'Staff Management', icon: 'ri-team-line', path: '/staff', roles: ['admin'] },
//     { key: 'claims', label: 'Claims Management', icon: 'ri-file-shield-line', path: '/claims', roles: ['admin'] },
//     { key: 'products', label: 'Products', icon: 'ri-product-hunt-line', path: '/products', roles: ['admin'] },
//     { key: 'amcs', label: 'AMC Management', icon: 'ri-file-shield-line', path: '/amcs', roles: ['admin', 'distributor', 'retailer'] },
//     { key: 'customers', label: 'Customers', icon: 'ri-user-heart-line', path: '/customers', roles: ['admin',] },
//     { key: 'wallet', label: 'Wallet', icon: 'ri-wallet-line', path: '/wallet', roles: ['admin', 'distributor', 'retailer'] },
//     { key: 'reports', label: 'Reports', icon: 'ri-bar-chart-line', path: '/reports', roles: ['admin', 'distributor'] },
//     { key: 'settings', label: 'Settings', icon: 'ri-settings-line', path: '/settings', roles: ['admin'] },
//   ];

//   const filteredMenuItems = menuItems.filter(item =>
//     user && item.roles.includes(user.role)
//   );

//   console.log("roleSSSSSSSSS=>", allRoles)
//   const handleLogout = () => {
//     // ✅ Clear only relevant items

//     sessionStorage.removeItem("token");
//     sessionStorage.removeItem("user");
//     sessionStorage.setItem("isAuthenticated", 'false');
//     setIsAuthenticated(false);
//     navigate("/");
//   };
//   //////////////////////////////////////////////////////////////////
//   const fetchRoles = async () => {
//     try {
//       const response = await getData('api/role/get-all-roles');
//       console.log("response==>response==> response==>", response)
//       if (response?.status === true) {
//         setAllRoles(response?.data);
//         setRole(response?.data.map((role) => role.name));
//       }
//     } catch (error) {
//       console.error('Error fetching roles:', error);
//     }
//   }

//   useEffect(() => {
//     fetchRoles();
//   }, [])
//   //////////////////////////////////////////////////////////////////////////////////////////////////////////
//   return (
//     <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
//       <div className="p-6 border-b border-gray-700">
//         <h1 className="text-xl font-bold">AMC Management</h1>
//         <p className="text-sm text-gray-400 capitalize">{user?.role} Panel</p>
//       </div>

//       <nav className="flex-1 p-4">
//         <ul className="space-y-2">
//           {filteredMenuItems.map((item) => (
//             <li key={item.key}>
//               <button
//                 onClick={() => onMenuClick(item.key, item.path)}
//                 className={clsx(
//                   'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors cursor-pointer',
//                   activeKey === item.key
//                     ? 'bg-blue-600 text-white'
//                     : 'text-gray-300 hover:bg-gray-800 hover:text-white'
//                 )}
//               >
//                 <i className={`${item.icon} mr-3 w-5 h-5 flex items-center justify-center`}></i>
//                 <span>{item.label}</span>
//               </button>
//             </li>
//           ))}
//         </ul>
//       </nav>

//       <div className="p-4 border-t border-gray-700">
//         <div className="flex items-center space-x-3 mb-4">
//           <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
//             <i className="ri-user-line w-5 h-5 flex items-center justify-center"></i>
//           </div>
//           <div>
//             <p className="font-medium">{user?.name}</p>
//             <p className="text-sm text-gray-400">{user?.email}</p>
//           </div>
//         </div>
//         <button
//           // onClick={() => useAuthStore.getState().logout()}
//           onClick={handleLogout}
//           className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer"
//         >
//           <i className="ri-logout-box-line mr-3 w-5 h-5 flex items-center justify-center"></i>
//           <span>Logout</span>
//         </button>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { getData } from '../../services/FetchNodeServices';

export default function Sidebar({ activeKey, onMenuClick, onClose }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('isAuthenticated') === 'true'
  );

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [rolesData, setRolesData] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [companySettings, setCompanySettings] = useState('');

  // ✅ All sidebar menu items
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', path: '/dashboard', module: 'Dashboard', roles: ['admin', 'distributor', 'retailer'] },
    { key: 'users', label: 'User Management', icon: 'ri-user-line', path: '/users', module: 'User Management', roles: ['admin', 'distributor'] },
    { key: 'staff', label: 'Staff Management', icon: 'ri-team-line', path: '/staff', module: 'Staff Management', roles: ['admin'] },
    { key: 'claims', label: 'Claims Management', icon: 'ri-file-shield-line', path: '/claims', module: 'Claims Management', roles: ['admin'] },
    { key: 'products', label: 'Products', icon: 'ri-product-hunt-line', path: '/products', module: 'Products', roles: ['admin'] },
    { key: 'amcs', label: 'WEC Management', icon: 'ri-file-shield-line', path: '/amcs', module: 'WEC Management', roles: ['admin', 'distributor', 'retailer'] },
    { key: 'customers', label: 'Customers', icon: 'ri-user-heart-line', path: '/customers', module: 'Customers', roles: ['admin'] },
    { key: 'wallet', label: 'Wallet', icon: 'ri-wallet-line', path: '/wallet', module: 'Wallet Management', roles: ['admin', 'distributor', 'retailer'] },
    { key: 'reports', label: 'Reports', icon: 'ri-bar-chart-line', path: '/reports', module: 'Reports', roles: ['admin', 'distributor'] },
    { key: 'settings', label: 'Settings', icon: 'ri-settings-line', path: '/settings', module: 'Settings', roles: ['admin'] },
    { key: 'alladmin', label: 'All Admin Management', icon: 'ri-shield-user-line', path: '/alladmin', module: 'Alladmin', roles: ['admin'] },
  ];

  // ✅ Fetch all roles and permissions
  const fetchRoles = async () => {
    try {
      const response = await getData('api/role/get-all-roles');
      if (response?.status === true) {
        setRolesData(response.data);

        // Find the logged-in user's role info (for staff roles)
        const matchedRole = response.data.find(r => r.name === user?.role);

        // Collect modules that have "read" permission
        const readModules = matchedRole?.permissions
          ?.filter(p => p.permissions.includes('read'))
          ?.map(p => p.module) || [];

        setUserPermissions(readModules);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    if (user && !['admin', 'distributor', 'retailer'].includes(user.role)) {
      // Only fetch for dynamic staff roles
      fetchRoles();
    }
  }, [user]);

  // ✅ Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    // If user is admin/distributor/retailer → use static role-based visibility
    if (['admin', 'distributor', 'retailer'].includes(user?.role)) {
      return item.roles.includes(user.role);
    }

    // Otherwise → use dynamic permission-based filtering
    return userPermissions.includes(item.module);
  });

  // ✅ Logout
  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.setItem('isAuthenticated', 'false');
    navigate('/');
    setIsAuthenticated(false);
  };



  const fetchTeamAndConditions = async () => {
    try {
      const response2 = await getData(`api/company/get-company-settings`);
      const response = await getData('api/company/get-AMC-settings');
      console.log("response==>get-team-and-conditions=>", response)
      // if (response?.status === true) {
      //   setTeamAndConditions(response?.data);
      //   // setAmcPercentage(response?.data?.defaultPercentage);
      // }
      if (response2?.status === true) {
        setCompanySettings(response2?.data);
      }
    } catch (error) {
      console.error('Error fetching team and conditions:', error);
    }
  }

  useEffect(() => {
    fetchTeamAndConditions();
  }, [])

  return (
    <div className="bg-gray-900 text-white w-64 h-screen flex flex-col overflow-hidden">
      {/* Header - fixed at top */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          {companySettings?.logo ? (
            <img
              src={companySettings?.logo}
              alt="Logo"
              className="h-20 w-20 sm:h-28 sm:w-28 object-contain"
            />
          ) : (
            <i className="ri-file-shield-line text-gray-700 text-5xl sm:text-6xl"></i>
          )}
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <i className="ri-close-line text-xl w-5 h-5 flex items-center justify-center"></i>
          </button>
        </div>
        {companySettings?.name && <h1 className="text-lg sm:text-xl font-bold">{companySettings?.name}</h1>}
        <p className="text-xs sm:text-sm text-gray-400 capitalize">{user?.role} Panel</p>
      </div>

      {/* Menu - scrollable */}
      <nav className="flex-1 p-4 overflow-y-auto min-h-0 sidebar-nav-scroll">
        <ul className="space-y-2">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => onMenuClick(item.key, item.path)}
                  className={clsx(
                    'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors cursor-pointer',
                    activeKey === item.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <i className={`${item.icon} mr-3 w-5 h-5 flex items-center justify-center`}></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="text-gray-500 text-sm px-4 py-2">
              No modules assigned
            </li>
          )}
        </ul>
      </nav>

      {/* Footer - fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <i className="ri-user-line w-5 h-5 flex items-center justify-center"></i>
          </div>
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-logout-box-line mr-3 w-5 h-5 flex items-center justify-center"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

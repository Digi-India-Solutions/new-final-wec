
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function Header({ onMenuToggle }) {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: '5 WECs expiring this month', type: 'warning', time: '2 hours ago' },
    { id: 2, message: 'New retailer registration pending', type: 'info', time: '4 hours ago' },
    { id: 3, message: 'Monthly report generated', type: 'success', time: '1 day ago' },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Hamburger menu button - visible only on mobile */}
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <i className="ri-menu-line text-xl w-6 h-6 flex items-center justify-center"></i>
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Welcome back, {user?.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            {/* <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-notification-line w-6 h-6 flex items-center justify-center"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button> */}
            
            {/* {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                    View all notifications
                  </button>
                </div>
              </div>
            )} */}
          </div>
          
          {/* <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <i className="ri-user-line text-white w-4 h-4 flex items-center justify-center"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div> */}
        </div>
      </div>
    </header>
  );
}

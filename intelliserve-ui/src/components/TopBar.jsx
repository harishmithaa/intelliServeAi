import { useState } from 'react';
import { Bell, HeartHandshake, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...args) {
  return twMerge(clsx(args));
}

export default function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);

  // Simulated notifications
  const notifications = [
    { id: 1, text: "Surplus food detected: 45 meals available for redistribution.", type: "alert", icon: AlertCircle, time: "10 mins ago" },
    { id: 2, text: "Nearest NGO (FoodBank Trust) notified for pickup.", type: "success", icon: HeartHandshake, time: "5 mins ago" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative z-10">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full focus:outline-none transition-colors relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-white" />
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 flex gap-3 cursor-pointer border-b border-gray-50 last:border-0">
                      <div className={cx("mt-0.5", notification.type === 'alert' ? 'text-amber-500' : 'text-green-500')}>
                        <notification.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">{notification.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            A
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}

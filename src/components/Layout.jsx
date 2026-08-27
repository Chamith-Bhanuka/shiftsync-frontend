import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSessionUser, clearSessionUser } from '../api/client';
import { usePushNotifications } from '../lib/usePushNotifications';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSessionUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeBounced, setBadgeBounced] = useState(false);

  const { connected, unreadCount } = usePushNotifications(user?.id);
  const prevUnreadCountRef = useRef(unreadCount);

  // Trigger bounce animation when unreadCount increases
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setBadgeBounced(true);
      const timer = setTimeout(() => setBadgeBounced(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  function handleSwitchUser() {
    clearSessionUser();
    navigate('/');
  }

  const isCurrent = (path) => location.pathname === path;

  // Initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Corporate Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Navigation */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-xs group-hover:bg-indigo-600 transition-colors">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Shift<span className="text-indigo-600">Sync</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
                <Link
                  to="/employee"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isCurrent('/employee')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-calendar-days text-xs text-slate-500"></i>
                  <span>My Shifts</span>
                </Link>

                <Link
                  to="/notifications"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                    isCurrent('/notifications')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-bell text-xs text-slate-500"></i>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center bg-rose-600 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] px-1 transition-transform duration-300 ${
                        badgeBounced ? 'scale-125 ring-2 ring-rose-300' : 'scale-100'
                      }`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/credentials"
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isCurrent('/credentials')
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-file-lines text-xs text-slate-500"></i>
                  <span>My Documents</span>
                </Link>

                {/* Manager Links */}
                {user?.role === 'Manager' && (
                  <div className="flex items-center gap-1 pl-3 ml-2 border-l border-slate-200">
                    <Link
                      to="/manager"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isCurrent('/manager')
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <i className="fa-solid fa-user-tie text-xs"></i>
                      <span>Manager Hub</span>
                    </Link>
                    <Link
                      to="/manager/documents"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isCurrent('/manager/documents')
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <i className="fa-solid fa-clipboard-check text-xs"></i>
                      <span>Document Reviews</span>
                    </Link>
                  </div>
                )}
              </nav>
            </div>

            {/* Right: User Profile & WebSocket Status */}
            <div className="hidden sm:flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2.5 pl-3 pr-2.5 py-1 bg-slate-100/90 rounded-lg border border-slate-200">
                  {/* Connection indicator */}
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                    title={connected ? 'Real-time WebSocket Live' : 'Reconnecting to live notifications'}
                  >
                    <span className="relative flex h-2 w-2">
                      {connected ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden lg:inline">
                      {connected ? 'Live' : 'Connecting'}
                    </span>
                  </div>

                  <div className="h-3.5 w-px bg-slate-300" />

                  {/* User Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {initials}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">{user.name}</span>
                      <span className="ml-1 text-slate-500 font-normal text-[11px]">
                        ({user.role === 'Manager' ? 'Manager' : 'Staff'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSwitchUser}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-[10px]"></i>
                <span>Switch User</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center gap-2">
              {user && (
                <span
                  className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-emerald-600' : 'bg-rose-500'}`}
                  title={connected ? 'Live' : 'Reconnecting'}
                />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-slide-in">
            {user && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                  <span>{connected ? 'Live' : 'Offline'}</span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Link
                to="/employee"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/employee') ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <i className="fa-solid fa-calendar-days text-slate-500 w-4"></i>
                <span>My Shifts</span>
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/notifications') ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-bell text-slate-500 w-4"></i>
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-rose-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/credentials"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/credentials') ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <i className="fa-solid fa-file-lines text-slate-500 w-4"></i>
                <span>My Documents</span>
              </Link>

              {user?.role === 'Manager' && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3">
                      Management
                    </span>
                  </div>
                  <Link
                    to="/manager"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isCurrent('/manager') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <i className="fa-solid fa-user-tie w-4"></i>
                    <span>Manager Hub</span>
                  </Link>
                  <Link
                    to="/manager/documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isCurrent('/manager/documents') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <i className="fa-solid fa-clipboard-check w-4"></i>
                    <span>Document Reviews</span>
                  </Link>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSwitchUser();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                <span>Switch User</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Corporate Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        ShiftSync · Enterprise Shift Scheduling & Compliance Management
      </footer>
    </div>
  );
}

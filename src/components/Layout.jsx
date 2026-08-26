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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Primary Navigation */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Shift<span className="text-indigo-600">Sync</span>
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
                <Link
                  to="/employee"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isCurrent('/employee')
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  My Shifts
                </Link>

                <Link
                  to="/notifications"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all relative inline-flex items-center gap-1.5 ${
                    isCurrent('/notifications')
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      className={`inline-flex items-center justify-center bg-rose-500 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] px-1 shadow-sm transition-transform duration-300 ${
                        badgeBounced ? 'scale-125 ring-2 ring-rose-300' : 'scale-100'
                      }`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/credentials"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isCurrent('/credentials')
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  My Documents
                </Link>

                {/* Manager Links Divider & Pills */}
                {user?.role === 'Manager' && (
                  <div className="flex items-center gap-1.5 pl-3 ml-2 border-l border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded mr-1">
                      Manager
                    </span>
                    <Link
                      to="/manager"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isCurrent('/manager')
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Manager Hub
                    </Link>
                    <Link
                      to="/manager/documents"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isCurrent('/manager/documents')
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      Document Reviews
                    </Link>
                  </div>
                )}
              </nav>
            </div>

            {/* Right: User Profile & WebSocket Status */}
            <div className="hidden sm:flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 bg-slate-100/80 rounded-full border border-slate-200/70">
                  {/* Connection indicator */}
                  <div
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
                    title={connected ? 'Real-time WebSocket Live' : 'Connecting / Reconnecting to WebSocket'}
                    aria-label={`Real-time status: ${connected ? 'Live' : 'Reconnecting'}`}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      {connected ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-400"></span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden lg:inline">
                      {connected ? 'Live Sync' : 'Reconnecting…'}
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-200" />

                  {/* User Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {initials}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">{user.name}</span>
                      <span className="ml-1 text-slate-500 font-normal">({user.role})</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSwitchUser}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                Switch user
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center gap-2">
              {user && (
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-rose-400'}`}
                  title={connected ? 'Live' : 'Reconnecting…'}
                />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
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
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                  {connected ? 'Live' : 'Reconnecting'}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Link
                to="/employee"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/employee') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                My Shifts
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/notifications') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/credentials"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isCurrent('/credentials') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                My Documents
              </Link>

              {user?.role === 'Manager' && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3">
                      Manager Tools
                    </span>
                  </div>
                  <Link
                    to="/manager"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isCurrent('/manager') ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Manager Hub
                  </Link>
                  <Link
                    to="/manager/documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isCurrent('/manager/documents') ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Document Reviews
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
                className="w-full text-center py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Switch user
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">{children}</main>

      {/* Modern subtle footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-600">
        ShiftSync · Real-time Roster & Shift Exchange System
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import { getNotifications, getUnreadNotifications, markNotificationRead } from '../api/client';
import { timeAgo } from '../lib/format';

export default function Notifications() {
  const user = useRequireSession();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');

  async function load() {
    if (!user) return;
    setError(false);
    setNotifications(null);
    try {
      const data = filter === 'unread' ? await getUnreadNotifications(user.id) : await getNotifications(user.id);
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(data);
    } catch (err) {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      showToast("Couldn't mark as read.", 'error');
    }
  }

  if (!user) return null;

  // FontAwesome Contextual Icon Helper
  const getNotificationIcon = (msg = '') => {
    const text = msg.toLowerCase();
    if (text.includes('approved')) return { iconClass: 'fa-solid fa-circle-check', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (text.includes('rejected') || text.includes('denied')) return { iconClass: 'fa-solid fa-circle-xmark', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (text.includes('swap') || text.includes('cover')) return { iconClass: 'fa-solid fa-arrow-right-arrow-left', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (text.includes('claimed') || text.includes('shift')) return { iconClass: 'fa-solid fa-calendar-check', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (text.includes('document') || text.includes('certificate')) return { iconClass: 'fa-solid fa-file-lines', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { iconClass: 'fa-solid fa-bell', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  return (
    <Layout>
      {/* Header with Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-bell text-slate-800 text-2xl"></i>
            <span>Activity & Notifications</span>
          </h1>
          <p className="text-sm text-slate-500">
            Real-time operational alerts for your shift assignments, swap requests, and management reviews.
          </p>
        </div>

        {/* Filter Pill Tabs */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {notifications === null && !error && (
        <div className="card text-center py-10 text-slate-500 text-sm">
          <div className="inline-block w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Retrieving notification log…</p>
        </div>
      )}

      {error && (
        <div className="card border-rose-200 bg-rose-50/70 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800 mb-1">Unable to load notifications.</p>
          <button className="btn-secondary text-xs mt-2" onClick={load}>Retry</button>
        </div>
      )}

      {notifications && notifications.length === 0 && (
        <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
          <i className="fa-regular fa-bell text-slate-300 text-3xl mb-2 block"></i>
          <p className="text-sm font-semibold text-slate-700">No Notifications</p>
          <p className="text-xs text-slate-500 mt-1">
            {filter === 'unread' ? 'You have no unread notifications.' : 'No activity history logged for your account.'}
          </p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="card p-0 divide-y divide-slate-100 overflow-hidden border-slate-200 shadow-2xs">
          {notifications.map((n) => {
            const { iconClass, bg } = getNotificationIcon(n.message);
            const isUnread = !n.read;

            return (
              <div
                key={n.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isUnread ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs shrink-0 mt-0.5 ${bg}`}
                  >
                    <i className={iconClass}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Unread" />
                      )}
                      <span className={`text-xs sm:text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {n.message}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5 flex items-center gap-1.5">
                      <span>{timeAgo(n.createdAt)}</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    className="btn-secondary text-xs py-1 px-2.5 self-end sm:self-auto border-slate-200 text-slate-700 hover:bg-slate-100"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <i className="fa-solid fa-check text-[10px]"></i>
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

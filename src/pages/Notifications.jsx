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
      showToast("Couldn't mark this read.", 'error');
    }
  }

  if (!user) return null;

  // Helper to pick contextual icon
  const getNotificationIcon = (msg = '') => {
    const text = msg.toLowerCase();
    if (text.includes('approved')) return { icon: '✓', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (text.includes('rejected') || text.includes('denied')) return { icon: '✕', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (text.includes('swap') || text.includes('cover')) return { icon: '⇄', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    if (text.includes('claimed') || text.includes('shift')) return { icon: '📅', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (text.includes('document') || text.includes('certificate')) return { icon: '📄', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { icon: '🔔', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  return (
    <Layout>
      {/* Header with Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Activity & Notifications</h1>
          <p className="text-sm text-slate-500">
            Real-time activity logs for your shift swaps, claims, and approvals.
          </p>
        </div>

        {/* Filter Pill Tabs */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {notifications === null && !error && (
        <div className="card text-center py-10 text-slate-500 text-sm">
          <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Retrieving notification log…</p>
        </div>
      )}

      {error && (
        <div className="card border-rose-200 bg-rose-50/70 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800 mb-1">Couldn't load notifications.</p>
          <button className="btn-secondary text-xs mt-2" onClick={load}>Retry</button>
        </div>
      )}

      {notifications && notifications.length === 0 && (
        <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
          <div className="text-3xl mb-2">🔔</div>
          <p className="text-base font-semibold text-slate-700">No Notifications</p>
          <p className="text-xs text-slate-600 mt-1">
            {filter === 'unread' ? 'You have no unread notifications.' : 'No notification history found for your account.'}
          </p>
        </div>
      )}

      {notifications && notifications.length > 0 && (
        <div className="card p-0 divide-y divide-slate-100 overflow-hidden border-slate-200/90 shadow-sm">
          {notifications.map((n) => {
            const { icon, bg } = getNotificationIcon(n.message);
            const isUnread = !n.read;

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isUnread ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 shadow-xs ${bg}`}
                  >
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" title="Unread" />
                      )}
                      <span className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {n.message}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-normal mt-1 flex items-center gap-1.5">
                      <span>{timeAgo(n.createdAt)}</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    className="btn-secondary text-xs py-1.5 px-3 self-end sm:self-auto border-indigo-200 text-indigo-700 hover:bg-indigo-100/50"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Mark read ✓
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

export function formatRange(start, end) {
  const startOpts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  const endOpts = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(start).toLocaleString(undefined, startOpts)} – ${new Date(end).toLocaleString(
    undefined,
    endOpts
  )}`;
}

export function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function badgeClass(status) {
  const map = {
    SCHEDULED: 'badge-blue',
    OPEN: 'badge-yellow',
    COVERED: 'badge-green',
    PENDING: 'badge-yellow',
    RESPONDED: 'badge-blue',
    APPROVED: 'badge-green',
    REJECTED: 'badge-gray',
    PENDING_REVIEW: 'badge-yellow',
  };
  return `badge ${map[status] || 'badge-gray'}`;
}

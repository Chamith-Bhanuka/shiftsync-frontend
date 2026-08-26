import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import {
  getShifts,
  getEmployees,
  createShift,
  getAwaitingDecisionSwapRequests,
  approveSwapRequest,
  rejectSwapRequest,
} from '../api/client';
import { formatRange, badgeClass } from '../lib/format';

export default function ManagerDashboard() {
  const user = useRequireSession();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [shifts, setShifts] = useState(null);
  const [shiftsError, setShiftsError] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [newShift, setNewShift] = useState({ employeeId: '', startTime: '', endTime: '' });

  const [swapRequests, setSwapRequests] = useState(null);
  const [swapRequestsError, setSwapRequestsError] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'Manager') navigate('/employee');
  }, [user, navigate]);

  async function loadShifts() {
    setShiftsError(false);
    setShifts(null);
    try {
      const data = await getShifts(1);
      data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setShifts(data);
    } catch (err) {
      setShiftsError(true);
    }
  }

  async function loadEmployees() {
    try {
      setEmployees(await getEmployees(1));
    } catch (err) {
      // non-fatal
    }
  }

  async function loadSwapRequests() {
    setSwapRequestsError(false);
    setSwapRequests(null);
    try {
      setSwapRequests(await getAwaitingDecisionSwapRequests());
    } catch (err) {
      setSwapRequestsError(true);
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'Manager') return;
    loadShifts();
    loadEmployees();
    loadSwapRequests();
  }, [user]);

  // Group shifts by date for optimal scannability
  const groupedShifts = useMemo(() => {
    if (!shifts) return {};
    const groups = {};
    shifts.forEach((shift) => {
      const dateKey = new Date(shift.startTime).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(shift);
    });
    return groups;
  }, [shifts]);

  if (!user || user.role !== 'Manager') return null;

  async function handleCreateShift(e) {
    e.preventDefault();
    if (!newShift.startTime || !newShift.endTime) {
      showToast('Start and end time are required.', 'error');
      return;
    }
    try {
      const payload = { locationId: 1, startTime: newShift.startTime, endTime: newShift.endTime };
      if (newShift.employeeId) payload.employeeId = newShift.employeeId;
      await createShift(payload);
      showToast('Shift added.', 'success');
      setNewShift({ employeeId: '', startTime: '', endTime: '' });
      loadShifts();
    } catch (err) {
      showToast("Couldn't create the shift. Check the times and try again.", 'error');
    }
  }

  async function handleApprove(id) {
    try {
      await approveSwapRequest(id);
      showToast('Swap approved.', 'success');
      setSwapRequests((prev) => prev.filter((r) => r.id !== id));
      loadShifts();
    } catch (err) {
      showToast("Couldn't approve this swap.", 'error');
    }
  }

  async function handleReject(id) {
    try {
      await rejectSwapRequest(id);
      showToast('Swap rejected.', 'info');
      setSwapRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast("Couldn't reject this swap.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Manager Command Hub</h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Admin Access
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Oversee team schedule, dispatch open shifts, and authorize swap requests.
          </p>
        </div>
        <button
          onClick={() => { loadShifts(); loadSwapRequests(); }}
          className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Board
        </button>
      </div>

      {/* SECTION 1: Swap Requests Awaiting Decision */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight m-0">
              Swap Requests Awaiting Decision
            </h2>
            {swapRequests && swapRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {swapRequests.length} Pending Approval
              </span>
            )}
          </div>
        </div>

        {swapRequests === null && !swapRequestsError && (
          <div className="card text-center py-6 text-slate-500 text-sm">
            <div className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading pending swap requests…
          </div>
        )}

        {swapRequestsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Couldn't load swap requests.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadSwapRequests}>Retry</button>
          </div>
        )}

        {swapRequests && swapRequests.length === 0 && (
          <div className="card bg-slate-50/70 border-dashed text-center py-6 text-slate-500 text-sm">
            ✨ No swap requests require manager approval at this time.
          </div>
        )}

        {swapRequests && swapRequests.length > 0 && (
          <div className="space-y-3">
            {swapRequests.map((req) => (
              <div
                key={req.id}
                className="card border-indigo-200/90 bg-white p-5 shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      ⇄
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">
                        {formatRange(req.shiftStartTime, req.shiftEndTime)}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-indigo-700">{req.requestingEmployeeName}</span>
                        <span>→</span>
                        <span className="font-semibold text-slate-700">
                          {req.targetEmployeeName || '(Open shift pool)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={badgeClass(req.status)}>{req.status}</span>
                </div>

                {/* Focal Point: Employee response highlight */}
                <div className="my-3.5">
                  {req.employeeResponse ? (
                    <div className="bg-indigo-50/70 border-l-4 border-indigo-500 rounded-r-lg p-3.5 text-sm shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                        <span>💬</span>
                        <span>{req.targetEmployeeName}'s response comment:</span>
                      </div>
                      <p className="text-slate-800 font-medium italic">"{req.employeeResponse}"</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50/70 border-l-4 border-amber-400 rounded-r-lg p-3 text-xs text-amber-800">
                      <em>{req.targetEmployeeName || 'Coworker'} has not left a comment yet — you may still authorize or reject this swap.</em>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button className="btn-success text-xs sm:text-sm px-4" onClick={() => handleApprove(req.id)}>
                    ✓ Approve Swap
                  </button>
                  <button className="btn-danger text-xs sm:text-sm px-4" onClick={() => handleReject(req.id)}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Add a Shift */}
      <div className="mb-10">
        <h2 className="section-title">Add / Schedule a Shift</h2>
        <form onSubmit={handleCreateShift} className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Assigned Employee</label>
              <select
                className="field mb-0"
                value={newShift.employeeId}
                onChange={(e) => setNewShift({ ...newShift, employeeId: e.target.value })}
              >
                <option value="">Leave unassigned (Open Shift)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Start Date & Time</label>
              <input
                type="datetime-local"
                className="field mb-0"
                value={newShift.startTime}
                onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="field-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="field mb-0"
                value={newShift.endTime}
                onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
            <button type="submit" className="btn text-xs sm:text-sm px-5">
              + Publish Shift to Board
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Shift Board (Grouped by Day) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title m-0">Master Shift Board</h2>
          {shifts && <span className="text-xs text-slate-500">{shifts.length} total shifts scheduled</span>}
        </div>

        {shifts === null && !shiftsError && (
          <div className="card text-center py-10 text-slate-500 text-sm">
            <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading master shift roster…</p>
          </div>
        )}

        {shiftsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Couldn't load the shift board.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadShifts}>Retry</button>
          </div>
        )}

        {shifts && shifts.length === 0 && (
          <div className="card border-dashed text-center py-8 text-slate-500 text-sm">
            No shifts scheduled yet. Use the form above to add your first shift.
          </div>
        )}

        {shifts && shifts.length > 0 && (
          <div className="space-y-4">
            {Object.entries(groupedShifts).map(([dateLabel, dayShifts]) => (
              <div key={dateLabel} className="card p-0 overflow-hidden border border-slate-200/90 shadow-xs">
                <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                    <span>📅</span> {dateLabel}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {dayShifts.map((shift) => {
                    const isOpen = !shift.employeeName;
                    return (
                      <div
                        key={shift.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 text-xs sm:text-sm">
                            {formatRange(shift.startTime, shift.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <div className="flex items-center gap-1.5">
                            {isOpen ? (
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                📢 OPEN SHIFT
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                {shift.employeeName}
                              </div>
                            )}
                          </div>

                          <span className={badgeClass(shift.status)}>{shift.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

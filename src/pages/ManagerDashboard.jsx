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

  // Group shifts by date for clean corporate table view
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
      showToast('Start and end times are required.', 'error');
      return;
    }
    try {
      const payload = { locationId: 1, startTime: newShift.startTime, endTime: newShift.endTime };
      if (newShift.employeeId) payload.employeeId = newShift.employeeId;
      await createShift(payload);
      showToast('Shift added to schedule.', 'success');
      setNewShift({ employeeId: '', startTime: '', endTime: '' });
      loadShifts();
    } catch (err) {
      showToast("Couldn't create the shift. Please check timestamps.", 'error');
    }
  }

  async function handleApprove(id) {
    try {
      await approveSwapRequest(id);
      showToast('Swap request approved.', 'success');
      setSwapRequests((prev) => prev.filter((r) => r.id !== id));
      loadShifts();
    } catch (err) {
      showToast("Couldn't approve swap request.", 'error');
    }
  }

  async function handleReject(id) {
    try {
      await rejectSwapRequest(id);
      showToast('Swap request rejected.', 'info');
      setSwapRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast("Couldn't reject swap request.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              <i className="fa-solid fa-user-tie text-slate-800 text-2xl"></i>
              <span>Manager Command Hub</span>
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
              <i className="fa-solid fa-shield-halved text-[10px]"></i>
              <span>Admin Access</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Oversee team schedules, dispatch shifts, and review colleague swap requests.
          </p>
        </div>
        <button
          onClick={() => { loadShifts(); loadSwapRequests(); }}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
          <span>Refresh Board</span>
        </button>
      </div>

      {/* SECTION 1: Swap Requests Awaiting Decision */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 m-0 flex items-center gap-2">
              <i className="fa-solid fa-arrow-right-arrow-left text-indigo-600 text-xs"></i>
              <span>Swap Requests Awaiting Approval</span>
            </h2>
            {swapRequests && swapRequests.length > 0 && (
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2 py-0.5 rounded border border-amber-200">
                {swapRequests.length} Pending
              </span>
            )}
          </div>
        </div>

        {swapRequests === null && !swapRequestsError && (
          <div className="card text-center py-6 text-slate-500 text-sm">
            <div className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading pending swap requests…
          </div>
        )}

        {swapRequestsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Unable to load swap requests.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadSwapRequests}>Retry</button>
          </div>
        )}

        {swapRequests && swapRequests.length === 0 && (
          <div className="card bg-slate-50/70 border-dashed text-center py-5 text-slate-500 text-xs flex items-center justify-center gap-2">
            <i className="fa-regular fa-circle-check text-slate-400"></i>
            <span>No pending swap requests requiring manager decision.</span>
          </div>
        )}

        {swapRequests && swapRequests.length > 0 && (
          <div className="space-y-3">
            {swapRequests.map((req) => (
              <div
                key={req.id}
                className="card border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xs shrink-0">
                      <i className="fa-solid fa-arrow-right-arrow-left"></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {formatRange(req.shiftStartTime, req.shiftEndTime)}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-900">{req.requestingEmployeeName}</span>
                        <i className="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
                        <span className="font-semibold text-slate-700">
                          {req.targetEmployeeName || '(Open Pool)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={badgeClass(req.status)}>{req.status}</span>
                </div>

                {/* Employee response note */}
                <div className="my-3">
                  {req.employeeResponse ? (
                    <div className="bg-slate-50 border-l-3 border-indigo-600 rounded-r-lg p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-0.5">
                        <i className="fa-regular fa-comment-dots text-slate-500"></i>
                        <span>{req.targetEmployeeName}'s response note:</span>
                      </div>
                      <p className="text-slate-700 italic">"{req.employeeResponse}"</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border-l-3 border-amber-400 rounded-r-lg p-2.5 text-xs text-slate-600">
                      <em>{req.targetEmployeeName || 'Coworker'} has not left an additional comment.</em>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button className="btn-success text-xs py-1.5 px-3.5" onClick={() => handleApprove(req.id)}>
                    <i className="fa-solid fa-check text-[11px]"></i>
                    <span>Approve Swap</span>
                  </button>
                  <button className="btn-danger text-xs py-1.5 px-3.5" onClick={() => handleReject(req.id)}>
                    <i className="fa-solid fa-xmark text-[11px]"></i>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Add / Schedule Shift */}
      <div className="mb-8">
        <h2 className="section-title">
          <i className="fa-solid fa-calendar-plus text-slate-600 text-base"></i>
          <span>Schedule New Shift</span>
        </h2>
        <form onSubmit={handleCreateShift} className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Assigned Staff</label>
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
            <button type="submit" className="btn text-xs py-2 px-4">
              <i className="fa-solid fa-plus text-[11px]"></i>
              <span>Publish Shift to Board</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: Master Shift Board */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title m-0">
            <i className="fa-solid fa-table-list text-slate-600 text-base"></i>
            <span>Master Shift Board</span>
          </h2>
          {shifts && <span className="text-xs text-slate-500 font-medium">{shifts.length} total shifts scheduled</span>}
        </div>

        {shifts === null && !shiftsError && (
          <div className="card text-center py-10 text-slate-500 text-sm">
            <div className="inline-block w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading master shift roster…</p>
          </div>
        )}

        {shiftsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Unable to load shift board.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadShifts}>Retry</button>
          </div>
        )}

        {shifts && shifts.length === 0 && (
          <div className="card border-dashed text-center py-8 text-slate-500 text-xs">
            No shifts scheduled yet. Use the form above to add a shift.
          </div>
        )}

        {shifts && shifts.length > 0 && (
          <div className="space-y-3">
            {Object.entries(groupedShifts).map(([dateLabel, dayShifts]) => (
              <div key={dateLabel} className="card p-0 overflow-hidden border border-slate-200 shadow-2xs">
                <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar text-slate-500"></i>
                    <span>{dateLabel}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {dayShifts.map((shift) => {
                    const isOpen = !shift.employeeName;
                    return (
                      <div
                        key={shift.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <i className="fa-regular fa-clock text-slate-400 text-xs"></i>
                          <span className="font-medium text-slate-900 text-xs sm:text-sm">
                            {formatRange(shift.startTime, shift.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                          <div className="flex items-center gap-1.5">
                            {isOpen ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <i className="fa-solid fa-bullhorn text-[10px]"></i>
                                <span>OPEN SHIFT</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                                <i className="fa-solid fa-user text-[10px] text-slate-400"></i>
                                <span>{shift.employeeName}</span>
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

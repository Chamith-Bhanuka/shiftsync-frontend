import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import {
  getShifts,
  getAvailableEmployeesForShift,
  createSwapRequest,
  claimShift,
  getSwapRequestsForEmployee,
  respondToSwapRequest,
} from '../api/client';
import { formatRange, badgeClass } from '../lib/format';

export default function EmployeeDashboard() {
  const user = useRequireSession();
  const { showToast } = useToast();

  const [shifts, setShifts] = useState(null);
  const [shiftsError, setShiftsError] = useState(false);

  const [swapFormShiftId, setSwapFormShiftId] = useState(null);
  const [availableCoworkers, setAvailableCoworkers] = useState([]);
  const [selectedCoworker, setSelectedCoworker] = useState('');
  const [swapFormLoading, setSwapFormLoading] = useState(false);

  const [myRequests, setMyRequests] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [responseComment, setResponseComment] = useState('');

  async function loadShifts() {
    setShiftsError(false);
    setShifts(null);
    try {
      const data = await getShifts(1);
      setShifts(data);
    } catch (err) {
      setShiftsError(true);
    }
  }

  async function loadMyRequests() {
    if (!user) return;
    try {
      const data = await getSwapRequestsForEmployee(user.id);
      setMyRequests(data);
    } catch (err) {
      setMyRequests([]);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadShifts();
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  const myShifts = shifts ? shifts.filter((s) => String(s.employeeId) === String(user.id)) : null;
  const openShifts = shifts ? shifts.filter((s) => s.status === 'OPEN') : null;
  const requestsNeedingMyResponse = myRequests
    ? myRequests.filter((r) => String(r.targetEmployeeId) === String(user.id) && r.status === 'PENDING')
    : null;

  async function openSwapForm(shiftId) {
    setSwapFormShiftId(shiftId);
    setSelectedCoworker('');
    setSwapFormLoading(true);
    setAvailableCoworkers([]);
    try {
      const available = await getAvailableEmployeesForShift(shiftId);
      setAvailableCoworkers(available.filter((e) => String(e.id) !== String(user.id)));
    } catch (err) {
      showToast("Couldn't load available coworkers for this shift.", 'error');
    } finally {
      setSwapFormLoading(false);
    }
  }

  async function submitSwapRequest() {
    if (!selectedCoworker) {
      showToast('Choose a coworker to offer this shift to.', 'error');
      return;
    }
    try {
      await createSwapRequest({
        shiftId: swapFormShiftId,
        requestingEmployeeId: user.id,
        targetEmployeeId: selectedCoworker,
      });
      showToast("Swap request sent. They'll need to respond, then a manager approves it.", 'success');
      setSwapFormShiftId(null);
      loadMyRequests();
    } catch (err) {
      showToast("Couldn't send the swap request. Try again.", 'error');
    }
  }

  async function handleClaim(shiftId) {
    try {
      await claimShift(shiftId, user.id);
      showToast('Shift claimed.', 'success');
      loadShifts();
    } catch (err) {
      showToast("Couldn't claim this shift. It may already be taken.", 'error');
    }
  }

  async function submitResponse(id, willing) {
    try {
      await respondToSwapRequest(id, { employeeId: user.id, comment: responseComment, willingToCover: willing });
      showToast('Response sent.', 'success');
      setRespondingId(null);
      setResponseComment('');
      loadMyRequests();
    } catch (err) {
      showToast("Couldn't send your response. Try again.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">My Roster & Shifts</h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user.name}</span>. Manage your schedule and shift swaps.
          </p>
        </div>
        <button onClick={() => { loadShifts(); loadMyRequests(); }} className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Schedule
        </button>
      </div>

      {/* SECTION 1: Urgent Swap Requests */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <h2 className="text-base font-bold text-slate-800 tracking-tight m-0">
            Swap Requests Needing Your Response
          </h2>
          {requestsNeedingMyResponse && requestsNeedingMyResponse.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {requestsNeedingMyResponse.length} Action Required
            </span>
          )}
        </div>

        {requestsNeedingMyResponse === null && (
          <div className="card text-center py-6 text-slate-500 text-sm">
            <div className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Checking pending swap requests…
          </div>
        )}

        {requestsNeedingMyResponse && requestsNeedingMyResponse.length === 0 && (
          <div className="card bg-slate-50/70 border-dashed text-center py-6 text-slate-500 text-sm">
            ✨ Nothing needs your response right now. You're all caught up!
          </div>
        )}

        {requestsNeedingMyResponse && requestsNeedingMyResponse.length > 0 && (
          <div className="space-y-3">
            {requestsNeedingMyResponse.map((req) => (
              <div
                key={req.id}
                className="card border-amber-300/80 bg-gradient-to-r from-amber-50/60 via-white to-white p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      🔄
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">
                        {formatRange(req.shiftStartTime, req.shiftEndTime)}
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-0.5">
                        <span className="font-semibold text-indigo-700">{req.requestingEmployeeName}</span> wants you to cover this shift
                      </div>
                    </div>
                  </div>
                  <span className={badgeClass(req.status)}>{req.status}</span>
                </div>

                {respondingId === req.id ? (
                  <div className="mt-4 pt-3 border-t border-amber-200/80 animate-slide-in">
                    <label className="field-label">Add a response note (optional)</label>
                    <input
                      className="field"
                      value={responseComment}
                      onChange={(e) => setResponseComment(e.target.value)}
                      placeholder="e.g. Sure, happy to help cover this shift."
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button className="btn-success text-xs sm:text-sm" onClick={() => submitResponse(req.id, true)}>
                        ✓ I can cover it
                      </button>
                      <button className="btn-danger text-xs sm:text-sm" onClick={() => submitResponse(req.id, false)}>
                        ✕ Can't cover it
                      </button>
                      <button className="btn-secondary text-xs sm:text-sm" onClick={() => setRespondingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-2 border-t border-amber-100">
                    <button className="btn text-xs sm:text-sm px-4" onClick={() => setRespondingId(req.id)}>
                      Respond to Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Upcoming Shifts */}
      <div className="mb-8">
        <h2 className="section-title">Upcoming Shifts</h2>

        {myShifts === null && !shiftsError && (
          <div className="card text-center py-8 text-slate-500 text-sm">
            <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading your upcoming shifts…</p>
          </div>
        )}

        {shiftsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Couldn't load your shifts.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadShifts}>Retry</button>
          </div>
        )}

        {myShifts && myShifts.length === 0 && (
          <div className="card border-dashed text-center py-8 text-slate-500 text-sm">
            📅 You have no upcoming shifts assigned on the schedule.
          </div>
        )}

        {myShifts && myShifts.length > 0 && (
          <div className="card p-2 sm:p-3 divide-y divide-slate-100">
            {myShifts.map((shift) => (
              <div key={shift.id} className="p-3 transition-colors hover:bg-slate-50/60 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      🕒
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">
                        {formatRange(shift.startTime, shift.endTime)}
                      </div>
                      <div className="text-xs text-slate-500 font-normal">Assigned to you</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className={badgeClass(shift.status)}>{shift.status}</span>
                    <button
                      className="btn-secondary text-xs sm:text-sm py-1.5 px-3"
                      onClick={() => openSwapForm(shift.id)}
                    >
                      Request Swap ⇄
                    </button>
                  </div>
                </div>

                {/* Inline Swap Request Drawer */}
                {swapFormShiftId === shift.id && (
                  <div className="mt-4 p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl animate-slide-in">
                    <div className="flex items-center justify-between mb-2">
                      <label className="field-label text-indigo-900 mb-0">Offer this shift to a coworker</label>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        ✓ Only showing coworkers without conflicts
                      </span>
                    </div>

                    {swapFormLoading ? (
                      <div className="py-4 text-center text-xs text-indigo-700">
                        <div className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Checking coworker schedules for conflicts…
                      </div>
                    ) : (
                      <>
                        <select
                          className="field mb-3"
                          value={selectedCoworker}
                          onChange={(e) => setSelectedCoworker(e.target.value)}
                        >
                          <option value="">Select an available coworker…</option>
                          {availableCoworkers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.role || 'Staff'})
                            </option>
                          ))}
                        </select>
                        {availableCoworkers.length === 0 && (
                          <p className="text-xs text-amber-700 mb-2">No other coworkers are currently available without conflict for this time window.</p>
                        )}
                      </>
                    )}

                    <div className="flex gap-2">
                      <button
                        className="btn text-xs sm:text-sm py-1.5"
                        onClick={submitSwapRequest}
                        disabled={swapFormLoading || !selectedCoworker}
                      >
                        Send Swap Request
                      </button>
                      <button
                        className="btn-secondary text-xs sm:text-sm py-1.5"
                        onClick={() => setSwapFormShiftId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Open Shifts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title m-0">Open Shifts</h2>
          <span className="text-xs text-slate-500">Available to claim immediately</span>
        </div>

        {openShifts && openShifts.length === 0 && (
          <div className="card border-dashed text-center py-6 text-slate-500 text-sm">
            ✨ No open shifts available for claiming right now.
          </div>
        )}

        {openShifts && openShifts.length > 0 && (
          <div className="grid gap-3">
            {openShifts.map((shift) => (
              <div
                key={shift.id}
                className="card border-dashed border-amber-300 bg-amber-50/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    📢
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm sm:text-base">
                      {formatRange(shift.startTime, shift.endTime)}
                    </div>
                    <div className="text-xs text-amber-700 font-medium mt-0.5">Unassigned — First come, first served</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className={badgeClass(shift.status)}>{shift.status}</span>
                  <button className="btn-success text-xs sm:text-sm py-1.5 px-4" onClick={() => handleClaim(shift.id)}>
                    Claim This Shift ✋
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Request Status Archive / Info */}
      <div className="card bg-slate-50/80 border-slate-200 p-4 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            Shift swaps require approval by a Manager after coworker acceptance. Real-time updates are pushed automatically.
          </span>
        </div>
      </div>
    </Layout>
  );
}

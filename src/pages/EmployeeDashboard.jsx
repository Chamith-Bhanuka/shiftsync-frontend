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
      showToast('Select a coworker to offer this shift to.', 'error');
      return;
    }
    try {
      await createSwapRequest({
        shiftId: swapFormShiftId,
        requestingEmployeeId: user.id,
        targetEmployeeId: selectedCoworker,
      });
      showToast('Swap request submitted. Awaiting coworker response and manager approval.', 'success');
      setSwapFormShiftId(null);
      loadMyRequests();
    } catch (err) {
      showToast("Couldn't send the swap request. Please try again.", 'error');
    }
  }

  async function handleClaim(shiftId) {
    try {
      await claimShift(shiftId, user.id);
      showToast('Shift claimed successfully.', 'success');
      loadShifts();
    } catch (err) {
      showToast("Couldn't claim this shift. It may already be assigned.", 'error');
    }
  }

  async function submitResponse(id, willing) {
    try {
      await respondToSwapRequest(id, { employeeId: user.id, comment: responseComment, willingToCover: willing });
      showToast('Response submitted.', 'success');
      setRespondingId(null);
      setResponseComment('');
      loadMyRequests();
    } catch (err) {
      showToast("Couldn't send response. Please try again.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-calendar-days text-slate-800 text-2xl"></i>
            <span>My Roster & Shifts</span>
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-800">{user.name}</span>. Manage your schedule and shift swaps.
          </p>
        </div>
        <button
          onClick={() => { loadShifts(); loadMyRequests(); }}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* SECTION 1: Action Required: Swap Requests */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 m-0 flex items-center gap-2">
            <i className="fa-solid fa-arrow-right-arrow-left text-amber-600 text-xs"></i>
            <span>Swap Requests Needing Your Response</span>
          </h2>
          {requestsNeedingMyResponse && requestsNeedingMyResponse.length > 0 && (
            <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2 py-0.5 rounded border border-amber-200">
              {requestsNeedingMyResponse.length} Action Required
            </span>
          )}
        </div>

        {requestsNeedingMyResponse === null && (
          <div className="card text-center py-6 text-slate-500 text-sm">
            <div className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
            Checking pending swap requests…
          </div>
        )}

        {requestsNeedingMyResponse && requestsNeedingMyResponse.length === 0 && (
          <div className="card bg-slate-50/70 border-dashed text-center py-5 text-slate-500 text-xs flex items-center justify-center gap-2">
            <i className="fa-regular fa-circle-check text-slate-400"></i>
            <span>No pending swap requests requiring your response.</span>
          </div>
        )}

        {requestsNeedingMyResponse && requestsNeedingMyResponse.length > 0 && (
          <div className="space-y-3">
            {requestsNeedingMyResponse.map((req) => (
              <div
                key={req.id}
                className="card border-amber-300/90 bg-amber-50/30 p-4 sm:p-5 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm shrink-0 mt-0.5">
                      <i className="fa-solid fa-arrow-right-arrow-left"></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {formatRange(req.shiftStartTime, req.shiftEndTime)}
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-0.5">
                        <span className="font-semibold text-slate-900">{req.requestingEmployeeName}</span> requested you to cover this shift
                      </div>
                    </div>
                  </div>
                  <span className={badgeClass(req.status)}>{req.status}</span>
                </div>

                {respondingId === req.id ? (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 animate-slide-in">
                    <label className="field-label">Response Note (Optional)</label>
                    <input
                      className="field"
                      value={responseComment}
                      onChange={(e) => setResponseComment(e.target.value)}
                      placeholder="e.g. Confirmed, available to cover this shift."
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button className="btn-success text-xs py-1.5 px-3" onClick={() => submitResponse(req.id, true)}>
                        <i className="fa-solid fa-check text-[11px]"></i>
                        <span>Accept Shift Cover</span>
                      </button>
                      <button className="btn-danger text-xs py-1.5 px-3" onClick={() => submitResponse(req.id, false)}>
                        <i className="fa-solid fa-xmark text-[11px]"></i>
                        <span>Decline</span>
                      </button>
                      <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setRespondingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end pt-2 border-t border-amber-200/50">
                    <button className="btn text-xs py-1.5 px-3.5" onClick={() => setRespondingId(req.id)}>
                      <i className="fa-solid fa-reply text-[10px]"></i>
                      <span>Respond to Request</span>
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
        <h2 className="section-title">
          <i className="fa-regular fa-clock text-slate-500 text-base"></i>
          <span>Assigned Shifts</span>
        </h2>

        {myShifts === null && !shiftsError && (
          <div className="card text-center py-8 text-slate-500 text-sm">
            <div className="inline-block w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading assigned shifts…</p>
          </div>
        )}

        {shiftsError && (
          <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
            <p className="text-sm font-semibold text-rose-800">Unable to load shift schedule.</p>
            <button className="btn-secondary text-xs mt-2" onClick={loadShifts}>Retry</button>
          </div>
        )}

        {myShifts && myShifts.length === 0 && (
          <div className="card border-dashed text-center py-8 text-slate-500 text-xs">
            <i className="fa-regular fa-calendar text-slate-400 text-xl mb-1 block"></i>
            <span>No shifts currently assigned to your profile.</span>
          </div>
        )}

        {myShifts && myShifts.length > 0 && (
          <div className="card p-0 divide-y divide-slate-100 overflow-hidden border-slate-200 shadow-2xs">
            {myShifts.map((shift) => (
              <div key={shift.id} className="p-4 transition-colors hover:bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs shrink-0">
                      <i className="fa-regular fa-clock"></i>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {formatRange(shift.startTime, shift.endTime)}
                      </div>
                      <div className="text-xs text-slate-500 font-normal">Assigned to your roster</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <span className={badgeClass(shift.status)}>{shift.status}</span>
                    <button
                      className="btn-secondary text-xs py-1.5 px-3"
                      onClick={() => openSwapForm(shift.id)}
                    >
                      <i className="fa-solid fa-arrow-right-arrow-left text-[10px]"></i>
                      <span>Request Swap</span>
                    </button>
                  </div>
                </div>

                {/* Inline Swap Request Form */}
                {swapFormShiftId === shift.id && (
                  <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-slide-in">
                    <div className="flex items-center justify-between mb-2">
                      <label className="field-label text-slate-800 mb-0">Offer Shift to Available Coworker</label>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <i className="fa-solid fa-check text-[10px]"></i>
                        <span>Conflict Checked</span>
                      </span>
                    </div>

                    {swapFormLoading ? (
                      <div className="py-3 text-center text-xs text-slate-600">
                        <div className="inline-block w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Checking coworker schedule conflicts…
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
                          <p className="text-xs text-amber-700 mb-2">
                            No coworkers are available for this specific shift time window.
                          </p>
                        )}
                      </>
                    )}

                    <div className="flex gap-2">
                      <button
                        className="btn text-xs py-1.5 px-3.5"
                        onClick={submitSwapRequest}
                        disabled={swapFormLoading || !selectedCoworker}
                      >
                        <i className="fa-solid fa-paper-plane text-[10px]"></i>
                        <span>Submit Swap Request</span>
                      </button>
                      <button
                        className="btn-secondary text-xs py-1.5 px-3"
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
          <h2 className="section-title m-0">
            <i className="fa-solid fa-bullhorn text-slate-500 text-base"></i>
            <span>Open Shifts Available</span>
          </h2>
          <span className="text-xs text-slate-500">First come, first served</span>
        </div>

        {openShifts && openShifts.length === 0 && (
          <div className="card border-dashed text-center py-6 text-slate-500 text-xs">
            No open shifts available to claim at this time.
          </div>
        )}

        {openShifts && openShifts.length > 0 && (
          <div className="grid gap-2.5">
            {openShifts.map((shift) => (
              <div
                key={shift.id}
                className="card border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center text-xs shrink-0">
                    <i className="fa-solid fa-bullhorn"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {formatRange(shift.startTime, shift.endTime)}
                    </div>
                    <div className="text-xs text-amber-700 font-medium mt-0.5">Unassigned Open Shift</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className={badgeClass(shift.status)}>{shift.status}</span>
                  <button className="btn-success text-xs py-1.5 px-3.5" onClick={() => handleClaim(shift.id)}>
                    <i className="fa-solid fa-hand text-[10px]"></i>
                    <span>Claim Shift</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Policy Note */}
      <div className="card bg-slate-50 border-slate-200 p-3.5 text-xs text-slate-600 flex items-center gap-2.5">
        <i className="fa-solid fa-circle-info text-slate-400 text-sm"></i>
        <span>
          Policy Notice: Shift swaps require coworker agreement followed by management approval. Real-time updates will be pushed to your notifications.
        </span>
      </div>
    </Layout>
  );
}

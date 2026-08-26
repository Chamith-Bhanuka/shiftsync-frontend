import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, setSessionUser } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState(false);

  async function load() {
    setError(false);
    setEmployees(null);
    try {
      const data = await getEmployees(1);
      setEmployees(data);
    } catch (err) {
      setError(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectUser(emp, asManager = false) {
    setSessionUser({ id: emp.id, name: emp.name, role: emp.role });
    navigate(asManager ? '/manager' : '/employee');
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full">
        {/* Header / Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-black shadow-lg shadow-indigo-200 mb-4 animate-bounce">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Welcome to ShiftSync
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Select an employee profile to enter the portal. No password required for this demonstration.
          </p>
        </div>

        {/* Loading State */}
        {employees === null && !error && (
          <div className="card text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-600">Loading roster profiles…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card border-rose-200 bg-rose-50/50 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-rose-900 mb-1">Couldn't connect to Backend Services</h3>
            <p className="text-xs text-rose-700 mb-4 max-w-xs mx-auto">
              Please check that the backend gateway and scheduling services are running.
            </p>
            <button className="btn-secondary text-xs px-4 py-2" onClick={load}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {employees && employees.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-sm text-slate-600">No employees found. Seed employees in the Scheduling Service first.</p>
          </div>
        )}

        {/* Employee Cards List */}
        {employees && employees.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Available Roster Profiles ({employees.length})
              </span>
              <span className="text-xs text-slate-600">Click to switch account</span>
            </div>

            <div className="grid gap-3">
              {employees.map((emp) => {
                const initials = emp.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const isManager = emp.role === 'Manager';

                return (
                  <div
                    key={emp.id}
                    className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 bg-white border border-slate-200/90 shadow-subtle hover:border-indigo-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          isManager
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-indigo-100'
                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{emp.name}</span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isManager
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1.5">
                          <span>{emp.email}</span>
                          <span>•</span>
                          <span className="text-slate-600">ID #{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        className="btn flex-1 sm:flex-none text-xs sm:text-sm py-2 px-3.5"
                        onClick={() => selectUser(emp)}
                      >
                        Continue
                      </button>
                      {isManager && (
                        <button
                          className="btn-secondary flex-1 sm:flex-none text-xs sm:text-sm py-2 px-3.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => selectUser(emp, true)}
                        >
                          As Manager 🛡️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

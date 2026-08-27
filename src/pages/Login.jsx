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
    <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white text-lg shadow-sm mb-3.5">
            <i className="fa-solid fa-building-user"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            ShiftSync Employee Portal
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
            Select an employee profile to access your scheduled roster and shift management workspace.
          </p>
        </div>

        {/* Loading State */}
        {employees === null && !error && (
          <div className="card text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-slate-600">Loading roster profiles…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card border-rose-200 bg-rose-50/50 p-6 text-center">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-circle-exclamation text-base"></i>
            </div>
            <h3 className="text-sm font-bold text-rose-900 mb-1">Backend Connectivity Error</h3>
            <p className="text-xs text-rose-700 mb-4 max-w-xs mx-auto">
              Unable to reach the ShiftSync gateway services. Please check the backend connection.
            </p>
            <button className="btn-secondary text-xs px-4 py-1.5 inline-flex items-center gap-1.5" onClick={load}>
              <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {employees && employees.length === 0 && (
          <div className="card text-center py-10">
            <i className="fa-solid fa-users-slash text-slate-400 text-2xl mb-2"></i>
            <p className="text-sm text-slate-600">No employees registered in this location.</p>
          </div>
        )}

        {/* Employee Cards List */}
        {employees && employees.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Active Staff Profiles ({employees.length})
              </span>
              <span className="text-xs text-slate-500">Click to enter workspace</span>
            </div>

            <div className="grid gap-2.5">
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
                    className="card card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs ${
                          isManager
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                              isManager
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <i className={`fa-solid ${isManager ? 'fa-user-tie' : 'fa-user'} text-[10px]`}></i>
                            <span>{emp.role}</span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1.5">
                          <span>{emp.email}</span>
                          <span>•</span>
                          <span>ID #{emp.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        className="btn flex-1 sm:flex-none text-xs py-1.5 px-3.5"
                        onClick={() => selectUser(emp)}
                      >
                        <span>Access</span>
                        <i className="fa-solid fa-arrow-right text-[10px]"></i>
                      </button>
                      {isManager && (
                        <button
                          className="btn-secondary flex-1 sm:flex-none text-xs py-1.5 px-3.5 text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                          onClick={() => selectUser(emp, true)}
                        >
                          <i className="fa-solid fa-shield-halved text-[10px]"></i>
                          <span>Manager Hub</span>
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

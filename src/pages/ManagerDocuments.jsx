import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import { getPendingReviewDocuments, reviewDocument } from '../api/client';
import { badgeClass } from '../lib/format';

const DOC_TYPE_LABELS = {
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  FOOD_HANDLER_CERT: 'Food Handler Certificate',
  ID_VERIFICATION: 'ID Verification',
  OTHER: 'Other Document',
};

const DOC_TYPE_ICONS = {
  MEDICAL_CERTIFICATE: '🏥',
  FOOD_HANDLER_CERT: '🍽️',
  ID_VERIFICATION: '🪪',
  OTHER: '📄',
};

export default function ManagerDocuments() {
  const user = useRequireSession();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [docs, setDocs] = useState(null);
  const [error, setError] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});

  useEffect(() => {
    if (user && user.role !== 'Manager') navigate('/employee');
  }, [user, navigate]);

  async function load() {
    setError(false);
    setDocs(null);
    try {
      setDocs(await getPendingReviewDocuments());
    } catch (err) {
      setError(true);
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'Manager') return;
    load();
  }, [user]);

  if (!user || user.role !== 'Manager') return null;

  async function handleDecision(objectPath, decision) {
    try {
      await reviewDocument(objectPath, decision, user.id, commentDrafts[objectPath] || '');
      showToast(
        decision === 'APPROVED' ? 'Document approved.' : 'Document rejected.',
        decision === 'APPROVED' ? 'success' : 'info'
      );
      setDocs((prev) => prev.filter((d) => d.objectPath !== objectPath));
    } catch (err) {
      showToast("Couldn't submit your decision. Try again.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Credential & Compliance Verification</h1>
            {docs && docs.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {docs.length} Awaiting Review
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Review uploaded employee certificates, medical releases, and compliance documentation.
          </p>
        </div>

        <button onClick={load} className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Queue
        </button>
      </div>

      {docs === null && !error && (
        <div className="card text-center py-10 text-slate-500 text-sm">
          <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading compliance verification queue…</p>
        </div>
      )}

      {error && (
        <div className="card border-rose-200 bg-rose-50/70 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800 mb-1">Couldn't load pending review documents.</p>
          <button className="btn-secondary text-xs mt-2" onClick={load}>Retry</button>
        </div>
      )}

      {docs && docs.length === 0 && (
        <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-base font-semibold text-slate-700">Verification Queue Clear</p>
          <p className="text-xs text-slate-600 mt-1">No employee compliance certificates or files are pending manager review.</p>
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="grid gap-4">
          {docs.map((doc) => {
            const icon = DOC_TYPE_ICONS[doc.documentType] || '📄';
            const label = DOC_TYPE_LABELS[doc.documentType] || doc.documentType;

            return (
              <div
                key={doc.objectPath}
                className="card border-slate-200/90 bg-white p-5 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl shrink-0">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">{label}</span>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                          Employee #{doc.employeeId}
                        </span>
                      </div>

                      {doc.note && (
                        <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">Employee Note:</span> {doc.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={badgeClass(doc.reviewStatus)}>{doc.reviewStatus}</span>
                </div>

                <div className="my-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg border border-indigo-200/60 transition-colors"
                  >
                    <span>📎 Open & Inspect Document</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <span className="text-[11px] text-slate-600">Secure link expires in 15 mins</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="field-label">Review feedback or rejection reason (optional)</label>
                  <input
                    className="field mb-3"
                    value={commentDrafts[doc.objectPath] || ''}
                    onChange={(e) => setCommentDrafts({ ...commentDrafts, [doc.objectPath]: e.target.value })}
                    placeholder="e.g. Approved. Certificate valid until Dec 2026."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="btn-success text-xs sm:text-sm px-4"
                      onClick={() => handleDecision(doc.objectPath, 'APPROVED')}
                    >
                      ✓ Approve Document
                    </button>
                    <button
                      className="btn-danger text-xs sm:text-sm px-4"
                      onClick={() => handleDecision(doc.objectPath, 'REJECTED')}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

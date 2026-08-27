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
  MEDICAL_CERTIFICATE: 'fa-solid fa-hospital',
  FOOD_HANDLER_CERT: 'fa-solid fa-utensils',
  ID_VERIFICATION: 'fa-solid fa-id-card',
  OTHER: 'fa-solid fa-file',
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
      showToast("Couldn't submit decision. Please try again.", 'error');
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              <i className="fa-solid fa-clipboard-check text-slate-800 text-2xl"></i>
              <span>Compliance & Credential Reviews</span>
            </h1>
            {docs && docs.length > 0 && (
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded border border-amber-200">
                {docs.length} Awaiting Review
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Review uploaded employee certificates, medical releases, and compliance documentation.
          </p>
        </div>

        <button onClick={load} className="btn-secondary text-xs self-start sm:self-auto">
          <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
          <span>Refresh Queue</span>
        </button>
      </div>

      {docs === null && !error && (
        <div className="card text-center py-10 text-slate-500 text-sm">
          <div className="inline-block w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading compliance verification queue…</p>
        </div>
      )}

      {error && (
        <div className="card border-rose-200 bg-rose-50/70 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800 mb-1">Unable to load document review queue.</p>
          <button className="btn-secondary text-xs mt-2" onClick={load}>Retry</button>
        </div>
      )}

      {docs && docs.length === 0 && (
        <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
          <i className="fa-regular fa-folder-closed text-slate-300 text-3xl mb-2 block"></i>
          <p className="text-sm font-semibold text-slate-700">Verification Queue Clear</p>
          <p className="text-xs text-slate-500 mt-1">No employee compliance certificates are pending manager review.</p>
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="grid gap-3.5">
          {docs.map((doc) => {
            const iconClass = DOC_TYPE_ICONS[doc.documentType] || 'fa-solid fa-file';
            const label = DOC_TYPE_LABELS[doc.documentType] || doc.documentType;

            return (
              <div
                key={doc.objectPath}
                className="card border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-base shrink-0">
                      <i className={iconClass}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{label}</span>
                        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          Employee #{doc.employeeId} {doc.employeeName ? `(${doc.employeeName})` : ''}
                        </span>
                      </div>

                      {doc.note && (
                        <div className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded border border-slate-100">
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    <span>Open & Inspect Document</span>
                  </a>
                  <span className="text-[11px] text-slate-400">Direct transmission</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="field-label">Review Feedback / Decision Reason (Optional)</label>
                  <input
                    className="field mb-3"
                    value={commentDrafts[doc.objectPath] || ''}
                    onChange={(e) => setCommentDrafts({ ...commentDrafts, [doc.objectPath]: e.target.value })}
                    placeholder="e.g. Verified and approved."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="btn-success text-xs py-1.5 px-3.5"
                      onClick={() => handleDecision(doc.objectPath, 'APPROVED')}
                    >
                      <i className="fa-solid fa-check text-[11px]"></i>
                      <span>Approve Document</span>
                    </button>
                    <button
                      className="btn-danger text-xs py-1.5 px-3.5"
                      onClick={() => handleDecision(doc.objectPath, 'REJECTED')}
                    >
                      <i className="fa-solid fa-xmark text-[11px]"></i>
                      <span>Reject</span>
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

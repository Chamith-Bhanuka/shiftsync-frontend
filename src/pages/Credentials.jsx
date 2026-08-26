import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import { getCredentialsForEmployee, uploadCredential } from '../api/client';
import { badgeClass } from '../lib/format';

const DOC_TYPES = [
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate', icon: '🏥' },
  { value: 'FOOD_HANDLER_CERT', label: 'Food Handler Certificate', icon: '🍽️' },
  { value: 'ID_VERIFICATION', label: 'ID Verification', icon: '🪪' },
  { value: 'OTHER', label: 'Other Documentation', icon: '📄' },
];

export default function Credentials() {
  const user = useRequireSession();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [docType, setDocType] = useState('MEDICAL_CERTIFICATE');
  const [note, setNote] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [files, setFiles] = useState(null);
  const [error, setError] = useState(false);

  async function loadDocuments() {
    if (!user) return;
    setError(false);
    setFiles(null);
    try {
      const data = await getCredentialsForEmployee(user.id);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(true);
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      showToast('Choose a file first.', 'error');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadCredential(user.id, user.name, docType, note, file);
      showToast(`Uploaded ${result.originalFilename || 'document'}. Waiting for manager review.`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFileName('');
      setNote('');
      loadDocuments();
    } catch (err) {
      showToast('Upload failed. Try again.', 'error');
    } finally {
      setUploading(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName('');
    }
  };

  const getDocMeta = (type) => {
    return DOC_TYPES.find((d) => d.value === type) || { label: type, icon: '📄' };
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">My Documents & Credentials</h1>
          <p className="text-sm text-slate-500">
            Submit certifications, medical notes, or identity files for management compliance review.
          </p>
        </div>

        <button onClick={loadDocuments} className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Documents
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-5">
          <div className="card p-5 border-slate-200/90 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="text-xl">📤</span>
              <h2 className="text-base font-bold text-slate-800 tracking-tight m-0">Upload New Credential</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="field-label">Document Classification</label>
                <select className="field mb-0" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Note for Reviewer (Optional)</label>
                <input
                  className="field mb-0"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Doctor's clearance for week of Sept 1"
                />
              </div>

              <div>
                <label className="field-label">Document File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-xl p-5 text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="text-2xl mb-1">📁</div>
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedFileName ? (
                      <span className="text-indigo-600 font-bold">{selectedFileName}</span>
                    ) : (
                      'Click to browse & select file'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">PDF, PNG, JPG, or DOC</p>
                </div>
              </div>

              <button
                className="btn w-full py-2.5 mt-2"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading File…
                  </>
                ) : (
                  'Submit for Manager Review 🚀'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Documents List */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 tracking-tight m-0">Uploaded Document History</h2>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Links valid 15m
            </span>
          </div>

          {files === null && !error && (
            <div className="card text-center py-10 text-slate-500 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading document history…</p>
            </div>
          )}

          {error && (
            <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
              <p className="text-sm font-semibold text-rose-800">Couldn't load your documents.</p>
              <button className="btn-secondary text-xs mt-2" onClick={loadDocuments}>Retry</button>
            </div>
          )}

          {files && files.length === 0 && (
            <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-base font-semibold text-slate-700">No Documents Uploaded</p>
              <p className="text-xs text-slate-600 mt-1">
                Upload your compliance certificates using the form on the left.
              </p>
            </div>
          )}

          {files && files.length > 0 && (
            <div className="space-y-3">
              {files.map((f) => {
                const meta = getDocMeta(f.documentType);
                const isRejected = f.reviewStatus === 'REJECTED';

                return (
                  <div
                    key={f.objectPath}
                    className={`card p-4.5 border transition-all ${
                      isRejected
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm sm:text-base">
                            {meta.label}
                          </div>
                          {f.note && (
                            <div className="text-xs text-slate-600 mt-0.5">
                              <span className="font-medium text-slate-700">Note:</span> {f.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={badgeClass(f.reviewStatus)}>{f.reviewStatus}</span>
                    </div>

                    {/* Prominent Manager Feedback Callout if present */}
                    {f.reviewComment && (
                      <div
                        className={`mt-3 p-3 rounded-lg text-xs ${
                          isRejected
                            ? 'bg-rose-100/70 border border-rose-200 text-rose-900'
                            : 'bg-indigo-50 border border-indigo-100 text-indigo-900'
                        }`}
                      >
                        <span className="font-bold">Manager Feedback:</span> {f.reviewComment}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={f.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>View Document</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span className="text-[10px] text-slate-600">Secure link</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

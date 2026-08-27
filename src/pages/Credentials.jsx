import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useRequireSession } from '../lib/useRequireSession';
import { useToast } from '../lib/ToastContext';
import { getCredentialsForEmployee, uploadCredential } from '../api/client';
import { badgeClass } from '../lib/format';

const DOC_TYPES = [
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate', iconClass: 'fa-solid fa-hospital' },
  { value: 'FOOD_HANDLER_CERT', label: 'Food Handler Certificate', iconClass: 'fa-solid fa-utensils' },
  { value: 'ID_VERIFICATION', label: 'ID Verification', iconClass: 'fa-solid fa-id-card' },
  { value: 'OTHER', label: 'Other Compliance Document', iconClass: 'fa-solid fa-file' },
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
      showToast('Select a document file to upload.', 'error');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadCredential(user.id, user.name, docType, note, file);
      showToast(`Uploaded ${result.originalFilename || 'document'}. Awaiting manager review.`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFileName('');
      setNote('');
      loadDocuments();
    } catch (err) {
      showToast('Upload failed. Please try again.', 'error');
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
    return DOC_TYPES.find((d) => d.value === type) || { label: type, iconClass: 'fa-solid fa-file' };
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">
            <i className="fa-solid fa-file-lines text-slate-800 text-2xl"></i>
            <span>My Documents & Credentials</span>
          </h1>
          <p className="text-sm text-slate-500">
            Submit compliance certificates, medical releases, and identity records for management review.
          </p>
        </div>

        <button onClick={loadDocuments} className="btn-secondary text-xs self-start sm:self-auto">
          <i className="fa-solid fa-arrows-rotate text-[11px]"></i>
          <span>Refresh Documents</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-5">
          <div className="card p-5 border-slate-200 shadow-2xs sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <i className="fa-solid fa-cloud-arrow-up text-slate-700 text-sm"></i>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 m-0">Upload Credential</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="field-label">Document Classification</label>
                <select className="field mb-0" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Reviewer Note (Optional)</label>
                <input
                  className="field mb-0"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Medical clearance certificate"
                />
              </div>

              <div>
                <label className="field-label">Document File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100/50 rounded-lg p-5 text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <i className="fa-solid fa-folder-open text-slate-400 text-2xl mb-1.5 block"></i>
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedFileName ? (
                      <span className="text-indigo-600 font-bold">{selectedFileName}</span>
                    ) : (
                      'Click to browse & select file'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PDF, PNG, JPG, or DOC</p>
                </div>
              </div>

              <button
                className="btn w-full py-2 mt-2"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading…</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-upload text-xs"></i>
                    <span>Submit for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Uploaded Documents List */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 m-0">Uploaded Document History</h2>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Direct link
            </span>
          </div>

          {files === null && !error && (
            <div className="card text-center py-10 text-slate-500 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading document history…</p>
            </div>
          )}

          {error && (
            <div className="card border-rose-200 bg-rose-50/70 p-4 text-center">
              <p className="text-sm font-semibold text-rose-800">Unable to load document records.</p>
              <button className="btn-secondary text-xs mt-2" onClick={loadDocuments}>Retry</button>
            </div>
          )}

          {files && files.length === 0 && (
            <div className="card bg-slate-50/70 border-dashed text-center py-12 text-slate-500">
              <i className="fa-regular fa-file text-slate-300 text-3xl mb-2 block"></i>
              <p className="text-sm font-semibold text-slate-700">No Documents Uploaded</p>
              <p className="text-xs text-slate-500 mt-1">
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
                    className={`card p-4 border transition-all ${
                      isRejected
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-sm shrink-0">
                          <i className={meta.iconClass}></i>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
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

                    {/* Manager Feedback Callout */}
                    {f.reviewComment && (
                      <div
                        className={`mt-2.5 p-2.5 rounded-lg text-xs ${
                          isRejected
                            ? 'bg-rose-100/70 border border-rose-200 text-rose-900'
                            : 'bg-indigo-50 border border-indigo-100 text-indigo-900'
                        }`}
                      >
                        <span className="font-bold">Manager Feedback:</span> {f.reviewComment}
                      </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={f.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>View Document</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </a>
                      <span className="text-[10px] text-slate-400">Encrypted transmission</span>
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

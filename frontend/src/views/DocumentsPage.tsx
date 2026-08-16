import React, { useState, useEffect } from 'react';
import { patientApi } from '../services/patient.api';
import { ApiError } from '../services/api';
import type { BackendDocument } from '../services/patient.api';

const CATEGORY_LABELS: Record<string, string> = {
  LAB_REPORT: 'Lab Reports',
  PRESCRIPTION: 'Prescriptions',
  SCAN_REPORT: 'Scan Reports',
  DISCHARGE_SUMMARY: 'Discharge Summaries',
  MEDICAL_CERTIFICATE: 'Certificates',
  OTHER: 'Other Records',
};

export const DocumentsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState<BackendDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('LAB_REPORT');
  const [description, setDescription] = useState('');

  const [selectedDoc, setSelectedDoc] = useState<BackendDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await patientApi.getDocuments();
      setDocs(res.documents);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setUploadError('Please select a file to upload.'); return; }

    setUploading(true); setUploadError('');
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', docType);
      if (description) formData.append('description', description);

      await patientApi.uploadDocument(formData);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setDescription('');
      loadDocs();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this medical document?')) return;
    setDeletingId(docId);
    try {
      await patientApi.deleteDocument(docId);
      if (selectedDoc?.id === docId) setSelectedDoc(null);
      loadDocs();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesCat = activeCategory === 'ALL' || d.documentType === activeCategory;
    const matchesQuery =
      d.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Documents & Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted health repository, lab reports, prescriptions and AI diagnostic OCR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload Document
          </button>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['ALL', 'LAB_REPORT', 'PRESCRIPTION', 'SCAN_REPORT', 'DISCHARGE_SUMMARY', 'OTHER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Files' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading document vault...</p>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-rose-400 text-[48px]">cloud_off</span>
          <p className="text-slate-800 font-bold">Failed to Load Documents</p>
          <p className="text-slate-500 text-sm">{error}</p>
          <button onClick={loadDocs} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Retry</button>
        </div>
      )}

      {!isLoading && !error && filteredDocs.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px]">folder_open</span>
          <p className="text-slate-700 font-bold">No Medical Documents Found</p>
          <p className="text-slate-500 text-sm">Upload lab reports, prescriptions, or discharge summaries to store them securely.</p>
          <button onClick={() => setIsUploadOpen(true)} className="mt-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Upload Now</button>
        </div>
      )}

      {/* Documents Grid */}
      {!isLoading && !error && filteredDocs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">
                      {doc.mimeType.includes('pdf') ? 'picture_as_pdf' : 'image'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {CATEGORY_LABELS[doc.documentType] || doc.documentType}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-1">{doc.originalFileName}</h3>
                {doc.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doc.description}</p>}

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-50">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-2">
                <a
                  href={patientApi.getDocumentUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 text-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-all"
                >
                  View / Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-slate-100 text-xs transition-all disabled:opacity-50"
                  title="Delete Document"
                >
                  {deletingId === doc.id ? (
                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900">Upload Medical Document</h3>
              <button onClick={() => { setIsUploadOpen(false); setUploadError(''); setSelectedFile(null); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {uploadError && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mb-3">{uploadError}</p>}
            <form onSubmit={handleUpload} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Select File (PDF, JPEG, PNG)</label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Category</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Description / Notes (Optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Annual lipid profile report"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              <button type="submit" disabled={uploading}
                className="mt-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

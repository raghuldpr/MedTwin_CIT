import React, { useState } from 'react';
import { MedicalDocument } from '../types';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  Download, 
  Eye, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Share2,
  Printer
} from 'lucide-react';

interface DocumentListProps {
  documents: MedicalDocument[];
  onUploadDocument?: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onUploadDocument,
}) => {
  const [selectedTab, setSelectedTab] = useState<'All' | 'Reports' | 'Prescriptions' | 'Scans'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesTab = selectedTab === 'All' || doc.category === selectedTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.doctor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.facility?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-amber-500" />;
      case 'DICOM':
        return <FileSpreadsheet className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header with Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Documents
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Clinical records, diagnostic reports, and digital prescriptions</p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-44 sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            />
          </div>

          <button
            onClick={onUploadDocument}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-3">
        {(['All', 'Reports', 'Prescriptions', 'Scans'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedTab === tab
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Document Rows */}
      <div className="space-y-3">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="group bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between gap-4 cursor-pointer"
          >
            {/* Left Doc Title & Meta */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                {getDocIcon(doc.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {doc.title}
                  </h4>
                  {doc.isNew && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {doc.date} • {doc.type} {doc.facility ? `• ${doc.facility}` : ''}
                </p>
              </div>
            </div>

            {/* Right Action Chevron */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-400 hidden sm:inline-block">{doc.size}</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  {getDocIcon(selectedDoc.type)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedDoc.title}</h3>
                  <p className="text-xs text-slate-500">{selectedDoc.date} • {selectedDoc.type} • {selectedDoc.facility}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h5 className="font-bold text-slate-800 mb-1">Executive Summary</h5>
                <p className="text-slate-600 leading-relaxed">{selectedDoc.summary}</p>
              </div>

              {selectedDoc.details && (
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-900 text-xs">Clinical Findings</h5>
                  <ul className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-100">
                    {selectedDoc.details.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-950">
                    <span className="font-bold">Impression: </span>
                    <span>{selectedDoc.details.impression}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>Physician: {selectedDoc.doctor || 'Verified Lab'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Document "${selectedDoc.title}" ready for download.`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

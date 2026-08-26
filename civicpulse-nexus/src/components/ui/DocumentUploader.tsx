import { useRef, useState } from 'react';
import {
  Upload, CheckCircle, XCircle, FileText, X,
  Eye, Download, RefreshCw, Clock, AlertTriangle,
} from 'lucide-react';
import type { DocumentMeta, DocVerificationStatus } from '../../api/documentApi';
import { documentApi } from '../../api/documentApi';
import toast from 'react-hot-toast';

// ─── Allowed types — must match backend whitelist ─────────────────────────────
const MAX_SIZE_MB   = 5;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS  = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
// Blocked executables (matches backend blocklist)
const BLOCKED_EXTS  = new Set(['.exe','.bat','.sh','.cmd','.php','.jsp','.js','.html','.xml','.svg']);

// ─── Verification status badge ────────────────────────────────────────────────
const VERIFICATION_UI: Record<DocVerificationStatus, { label: string; cls: string; icon: React.ElementType }> = {
  UPLOADED:          { label: 'Uploaded',        cls: 'text-slate-400 bg-slate-500/15',   icon: Clock        },
  UNDER_REVIEW:      { label: 'Under Review',    cls: 'text-amber-400 bg-amber-500/15',   icon: Clock        },
  VERIFIED:          { label: 'Verified ✓',      cls: 'text-emerald-400 bg-emerald-500/15',icon: CheckCircle },
  REJECTED:          { label: 'Rejected',        cls: 'text-red-400 bg-red-500/15',       icon: XCircle      },
  REUPLOAD_REQUIRED: { label: 'Re-upload Needed',cls: 'text-orange-400 bg-orange-500/15', icon: AlertTriangle},
};

export interface UploadedFile {
  docName: string;
  file: File;
  previewName: string;
}

interface Props {
  docName: string;
  required: boolean;
  /** Local file chosen but not yet sent to backend */
  onUpload: (docName: string, file: File | null) => void;
  uploadedFile?: File | null;
  error?: string;
  /** If a document has already been saved to the backend, pass its metadata */
  savedDocument?: DocumentMeta | null;
  /** Who is requesting (citizenId) — needed for download/preview */
  requesterId?: string;
  /** Called when backend document is deleted */
  onDeleted?: (documentId: string) => void;
  /** Called when backend document is replaced */
  onReplaced?: (doc: DocumentMeta) => void;
}

export function DocumentUploader({
  docName, required, onUpload, uploadedFile, error,
  savedDocument, requesterId, onDeleted, onReplaced,
}: Props) {
  const inputRef     = useRef<HTMLInputElement>(null);
  const replaceRef   = useRef<HTMLInputElement>(null);
  const [localError, setLocalError]   = useState<string | null>(null);
  const [busy,       setBusy]         = useState(false);

  const validate = (file: File): string | null => {
    const ext = ('.' + file.name.split('.').pop()).toLowerCase();
    if (BLOCKED_EXTS.has(ext))         return 'File type not permitted';
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase()))
      return 'Invalid type. Allowed: PDF, JPG, PNG, WebP';
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large. Max ${MAX_SIZE_MB}MB`;
    if (file.size === 0)               return 'File is empty';
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validate(file);
    if (err) { setLocalError(err); return; }
    setLocalError(null);
    onUpload(docName, file);
  };

  const handleRemove = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setLocalError(null);
    onUpload(docName, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Preview (opens in new tab via backend stream) ─────────────────────────
  const handlePreview = async (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!savedDocument || !requesterId) return;
    setBusy(true);
    try {
      await documentApi.preview(savedDocument.documentId, requesterId);
    } catch { toast.error('Preview failed'); }
    finally { setBusy(false); }
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!savedDocument || !requesterId) return;
    setBusy(true);
    try {
      const { blob, filename } = await documentApi.download(savedDocument.documentId, requesterId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    finally { setBusy(false); }
  };

  // ── Delete saved document ─────────────────────────────────────────────────
  const handleDelete = async (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!savedDocument || !requesterId) return;
    if (!window.confirm(`Delete "${savedDocument.documentType}"?`)) return;
    setBusy(true);
    try {
      await documentApi.delete(savedDocument.documentId, requesterId);
      onDeleted?.(savedDocument.documentId);
      toast.success('Document deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Delete failed');
    } finally { setBusy(false); }
  };

  // ── Replace saved document ────────────────────────────────────────────────
  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !savedDocument || !requesterId) return;
    const err = validate(file);
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const updated = await documentApi.replace(savedDocument.documentId, requesterId, file);
      onReplaced?.(updated);
      toast.success('Document replaced');
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Replace failed');
    } finally {
      setBusy(false);
      if (replaceRef.current) replaceRef.current.value = '';
    }
  };

  const displayError = localError || error;

  // ── If a saved backend document exists, show its status ───────────────────
  if (savedDocument) {
    const ui = VERIFICATION_UI[savedDocument.verificationStatus];
    const StatusIcon = ui.icon;
    const canReplace = ['UPLOADED','REJECTED','REUPLOAD_REQUIRED'].includes(savedDocument.verificationStatus);
    const canDelete  = savedDocument.verificationStatus !== 'VERIFIED';

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-800/40 border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">
                {docName}{required && <span className="text-red-400 ml-1">*</span>}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {savedDocument.originalFileName} · {(savedDocument.fileSize / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-2 flex items-center gap-1 flex-wrap justify-end">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${ui.cls}`}>
              <StatusIcon className="w-3 h-3" /> {ui.label}
            </span>
            {/* Preview */}
            <button type="button" onClick={handlePreview} disabled={busy}
              title="Preview" className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </button>
            {/* Download */}
            <button type="button" onClick={handleDownload} disabled={busy}
              title="Download" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
              <Download className="w-3.5 h-3.5" />
            </button>
            {/* Replace */}
            {canReplace && (
              <>
                <button type="button" onClick={() => replaceRef.current?.click()} disabled={busy}
                  title="Replace" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <input ref={replaceRef} type="file" accept={ALLOWED_EXTS.join(',')}
                  onChange={handleReplaceChange} className="hidden" />
              </>
            )}
            {/* Delete */}
            {canDelete && (
              <button type="button" onClick={handleDelete} disabled={busy}
                title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {/* Rejection reason */}
        {savedDocument.verificationStatus === 'REJECTED' && savedDocument.rejectionReason && (
          <p className="text-xs text-red-400 pl-1">Rejection: {savedDocument.rejectionReason}</p>
        )}
      </div>
    );
  }

  // ── No saved document — show local upload control (unchanged UI) ──────────
  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
          uploadedFile
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : displayError
              ? 'bg-red-500/5 border-red-500/30'
              : 'bg-slate-800/40 border-white/10 hover:border-teal-500/30 cursor-pointer'
        }`}
        onClick={() => !uploadedFile && inputRef.current?.click()}
      >
        <div className="flex items-center gap-2 min-w-0">
          {uploadedFile
            ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            : displayError
              ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              : <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          }
          <div className="min-w-0">
            <p className="text-sm text-slate-200 truncate">
              {docName}{required && <span className="text-red-400 ml-1">*</span>}
            </p>
            {uploadedFile && (
              <p className="text-xs text-emerald-400 truncate mt-0.5">
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 ml-2">
          {uploadedFile ? (
            <button type="button" onClick={handleRemove}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
              <X className="w-3 h-3" /> Remove
            </button>
          ) : (
            <button type="button" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium">
              <Upload className="w-3 h-3" /> Choose File
            </button>
          )}
        </div>
      </div>
      {displayError && <p className="text-xs text-red-400 pl-1">{displayError}</p>}
      <input ref={inputRef} type="file" accept={ALLOWED_EXTS.join(',')}
        onChange={handleChange} className="hidden" aria-label={`Upload ${docName}`} />
    </div>
  );
}

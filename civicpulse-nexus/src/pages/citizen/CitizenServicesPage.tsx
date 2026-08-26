import { useSearchStore } from '../../store/searchStore';
import { useState, useCallback } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Modal } from '../../components/ui/Modal';
import { DocumentUploader } from '../../components/ui/DocumentUploader';
import { DynamicFormField } from '../../components/ui/DynamicFormField';
import { useAuthStore } from '../../store/authStore';
import { useApplicationStore } from '../../store/applicationStore';
import { SERVICE_CONFIG, getServiceConfig } from '../../config/serviceConfig';
import type { ServiceApplication } from '../../types';
import toast from 'react-hot-toast';

const CERT_ICON: Record<string, string> = {
  'Birth Certificate': '👶', 'Death Certificate': '📋', 'Income Certificate': '💰',
  'Residence Certificate': '🏠', 'Marriage Certificate': '💍', 'Caste Certificate': '📜',
  'Trade License': '🏪', 'Building Permit': '🏗️', 'Food License': '🍽️',
  'Event Permit': '🎪', 'Signage Permit': '🪧',
};

type ModalView = 'info' | 'apply' | 'success';

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateFormField(value: string, field: import('../../config/serviceConfig').FormField): string | null {
  if (field.required && !value.trim()) return `${field.label} is required`;
  if (!value.trim()) return null; // optional, empty is fine

  if (field.type === 'aadhaar') {
    if (!/^\d{4}-?\d{4}-?\d{4}$/.test(value.trim()))
      return 'Invalid Aadhaar format (XXXX-XXXX-XXXX)';
  }
  if (field.type === 'phone') {
    if (!/^[6-9]\d{9}$/.test(value.trim()))
      return 'Invalid phone number (10 digits starting 6-9)';
  }
  if (field.type === 'number') {
    const n = Number(value);
    if (isNaN(n)) return `${field.label} must be a number`;
    if (field.min !== undefined && n < field.min) return `${field.label} must be ≥ ${field.min}`;
    if (field.max !== undefined && n > field.max) return `${field.label} must be ≤ ${field.max}`;
  }
  if (field.type === 'date') {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Invalid date';
    if (d > new Date()) {
      // date of birth / date of death should not be future — but event date can be
      // only flag obvious issues
    }
  }
  return null;
}

export default function CitizenServicesPage() {
  const user = useAuthStore(s => s.user);
  const { submitApplication, loading } = useApplicationStore();

  // Catalogue state
  const [filter, setFilter] = useState<'all' | 'certificate' | 'permit'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<ModalView>('info');

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [files, setFiles]           = useState<Record<string, File | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [submittedApp, setSubmittedApp] = useState<ServiceApplication | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const config = selected ? getServiceConfig(selected) : null;

  const { query: searchQuery } = useSearchStore();
  const q = searchQuery.trim().toLowerCase();

  const filteredServices = Object.values(SERVICE_CONFIG).filter(s => {
    const matchCat = filter === 'all' || s.category === filter;
    const matchQ   = !q
      || s.serviceName.toLowerCase().includes(q)
      || s.category.toLowerCase().includes(q)
      || s.description.toLowerCase().includes(q)
      || s.benefits.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const resetForm = () => {
    setFormValues({});
    setFormErrors({});
    setFiles({});
    setFileErrors({});
    setSubmitError(null);
  };

  const openApply = (name: string) => {
    setSelected(name);
    resetForm();
    setView('apply');
  };

  const openInfo = (name: string) => {
    setSelected(name);
    setView('info');
  };

  const closeModal = () => {
    setSelected(null);
    resetForm();
    setSubmittedApp(null);
  };

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  }, []);

  const handleFileUpload = useCallback((docName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docName]: file }));
    setFileErrors(prev => { const n = { ...prev }; delete n[docName]; return n; });
  }, []);

  // Validate all required fields and documents, return true if clean
  const validate = (): boolean => {
    if (!config || !user) return false;
    const newFormErrors: Record<string, string> = {};
    const newFileErrors: Record<string, string> = {};
    let valid = true;

    // Validate form fields
    for (const field of config.requiredFormFields) {
      const err = validateFormField(formValues[field.name] ?? '', field);
      if (err) { newFormErrors[field.name] = err; valid = false; }
    }

    // Validate required documents
    for (const doc of config.requiredDocuments) {
      if (!files[doc]) {
        newFileErrors[doc] = `${doc} is required`;
        valid = false;
      }
    }

    setFormErrors(newFormErrors);
    setFileErrors(newFileErrors);
    return valid;
  };

  const allRequiredDocsDone = () => {
    if (!config) return false;
    return config.requiredDocuments.every(doc => !!files[doc]);
  };

  const allRequiredFieldsDone = () => {
    if (!config) return false;
    return config.requiredFormFields
      .filter(f => f.required)
      .every(f => (formValues[f.name] ?? '').trim().length > 0);
  };

  const canSubmit = allRequiredDocsDone() && allRequiredFieldsDone() && !loading;

  const handleSubmit = async () => {
    if (!validate() || !config || !user) return;
    setSubmitError(null);

    const uploadedFiles: Record<string, File> = {};
    for (const doc of config.requiredDocuments) {
      if (files[doc]) uploadedFiles[doc] = files[doc]!;
    }

    try {
      const app = await submitApplication({
        citizenId:   user.id,
        citizenName: user.name,
        type:        config.serviceName,
        category:    config.category,
        formData:    formValues,
        files:       uploadedFiles,
      });
      setSubmittedApp(app);
      setView('success');
      toast.success(`${config.serviceName} application submitted!`);
    } catch (e: any) {
      const msg = e?.message ?? 'Submission failed. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Services" subtitle="Apply for certificates & permits" />

      <div className="p-6 space-y-6">
        {/* ── Filter tabs — UNCHANGED ── */}
        <div className="flex gap-2">
          {(['all', 'certificate', 'permit'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/10'
              }`}>
              {f === 'all' ? 'All Services' : f === 'certificate' ? 'Certificates' : 'Permits & Licenses'}
            </button>
          ))}
        </div>

        {/* ── Service Grid — UNCHANGED layout ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm">
              No services match your search.
            </div>
          )}
          {filteredServices.map(s => (
            <div key={s.serviceName}
              className="glass rounded-2xl p-5 border border-white/5 hover:border-teal-500/20 transition-all cursor-pointer"
              onClick={() => openInfo(s.serviceName)}>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{CERT_ICON[s.serviceName] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{s.serviceName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.category === 'certificate' ? 'bg-teal-500/15 text-teal-400' : 'bg-violet-500/15 text-violet-400'
                    }`}>{s.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>⏱ {s.processingDays}d</span>
                  <span className={s.fee === 0 ? 'text-emerald-400' : ''}>
                    {s.fee === 0 ? 'Free' : `₹${s.fee}`}
                  </span>
                  <span>📄 {s.requiredDocuments.length} docs</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openApply(s.serviceName); }}
                  className="text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Service Info Modal — UNCHANGED ── */}
      <Modal isOpen={!!selected && view === 'info'} onClose={closeModal}
        title={selected || ''} size="sm">
        {config && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{config.description}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {([
                ['Processing', `${config.processingDays} days`],
                ['Fee',        config.fee === 0 ? 'Free' : `₹${config.fee}`],
                ['Docs',       `${config.requiredDocuments.length} required`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{k}</p>
                  <p className="text-white font-medium mt-0.5 text-sm">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Required Documents</p>
              <ul className="space-y-1.5">
                {config.requiredDocuments.map(d => (
                  <li key={d} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />{d}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => { resetForm(); setView('apply'); }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Apply Now
            </button>
          </div>
        )}
      </Modal>

      {/* ── Apply Modal — FULL VALIDATED FORM ── */}
      <Modal isOpen={!!selected && view === 'apply'} onClose={closeModal}
        title={`Apply — ${selected || ''}`} size="xl">
        {config && user && (
          <div className="space-y-5">
            {/* Applicant info */}
            <div className="bg-teal-500/10 rounded-xl p-3 border border-teal-500/20">
              <p className="text-xs text-teal-400 font-medium">Applicant</p>
              <p className="text-sm text-white mt-0.5">{user.name} · {user.ward}</p>
            </div>

            {/* Dynamic form fields */}
            {config.requiredFormFields.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-3">Application Details</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {config.requiredFormFields.map(field => (
                    <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <DynamicFormField
                        field={field}
                        value={formValues[field.name] ?? ''}
                        onChange={handleFieldChange}
                        error={formErrors[field.name]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document upload */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">
                Required Documents
                <span className="text-xs text-slate-500 font-normal ml-2">
                  PDF/JPG/PNG · max 5MB each
                </span>
              </p>
              <div className="space-y-2">
                {config.requiredDocuments.map(doc => (
                  <DocumentUploader
                    key={doc}
                    docName={doc}
                    required
                    onUpload={handleFileUpload}
                    uploadedFile={files[doc]}
                    error={fileErrors[doc]}
                  />
                ))}
                {config.optionalDocuments.length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 pt-2">Optional Documents</p>
                    {config.optionalDocuments.map(doc => (
                      <DocumentUploader
                        key={doc}
                        docName={doc}
                        required={false}
                        onUpload={handleFileUpload}
                        uploadedFile={files[doc]}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Fee */}
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl text-sm">
              <span className="text-slate-400">Application Fee</span>
              <span className={`font-semibold ${config.fee === 0 ? 'text-emerald-400' : 'text-white'}`}>
                {config.fee === 0 ? 'Free' : `₹${config.fee}`}
              </span>
            </div>

            {/* Completeness indicator */}
            {!canSubmit && (
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-xs text-amber-400">
                ⚠ Complete all required fields and upload all required documents before submitting.
              </div>
            )}

            {/* Server error */}
            {submitError && (
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-xs text-red-400">
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                title={!canSubmit ? 'Fill all required fields and upload all required documents' : ''}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Success Screen ── */}
      <Modal isOpen={view === 'success' && !!submittedApp} onClose={closeModal}
        title="Application Submitted" size="md">
        {submittedApp && config && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Application Submitted Successfully</h3>
            </div>

            <div className="glass rounded-2xl p-4 border border-emerald-500/20 space-y-3">
              {([
                ['Application Number', submittedApp.appId],
                ['Service',           submittedApp.type],
                ['Status',            'Submitted'],
                ['Expected Completion', `${config.processingDays} working days`],
                ['Fee',               submittedApp.fee === 0 ? 'Free' : `₹${submittedApp.fee}`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{k}</span>
                  <span className={`text-sm font-medium ${k === 'Application Number' ? 'text-teal-400 font-mono' : 'text-white'}`}>{v}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 text-center">
              You will be notified when your application status changes. Track progress in My Applications.
            </p>

            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm font-medium">
                Close
              </button>
              <button
                onClick={() => { closeModal(); window.location.href = '/citizen/applications'; }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                My Applications <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

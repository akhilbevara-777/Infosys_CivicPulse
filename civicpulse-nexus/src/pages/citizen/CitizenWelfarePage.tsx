import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Upload, ChevronRight, RefreshCw } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Modal } from '../../components/ui/Modal';
import { statusBadge } from '../../components/ui/Badge';
import { DocumentUploader } from '../../components/ui/DocumentUploader';
import { DynamicFormField } from '../../components/ui/DynamicFormField';
import { useAuthStore } from '../../store/authStore';
import { useSearchStore } from '../../store/searchStore';
import { welfareApi } from '../../api/welfareApi';
import type { WelfareScheme, WelfareApplication } from '../../types';
import { getWelfareConfig, evaluateEligibility, canSubmit } from '../../config/welfareConfig';
import type { WelfareSchemeConfig } from '../../config/welfareConfig';
import toast from 'react-hot-toast';

// ─── Constants (same as before — UI unchanged) ────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  Housing: 'bg-teal-500/15 text-teal-400',
  Education: 'bg-violet-500/15 text-violet-400',
  Healthcare: 'bg-rose-500/15 text-rose-400',
  'Women & Child': 'bg-pink-500/15 text-pink-400',
  'Senior Citizen': 'bg-amber-500/15 text-amber-400',
  Disability: 'bg-blue-500/15 text-blue-400',
  Employment: 'bg-orange-500/15 text-orange-400',
  Agriculture: 'bg-emerald-500/15 text-emerald-400',
};
const CAT_EMOJI: Record<string, string> = {
  Housing: '🏠', Education: '📚', Healthcare: '🏥', Agriculture: '🌾',
  'Women & Child': '👩‍👧', 'Senior Citizen': '👴', Disability: '♿', Employment: '💼',
};

// ─── Disbursement status display ─────────────────────────────────────────────
const STATUS_LABELS: Record<WelfareApplication['status'], string> = {
  submitted:            '📋 Application Submitted',
  under_verification:   '🔍 Under Verification',
  eligibility_check:    '✅ Eligibility Check',
  approved:             '✅ Approved',
  rejected:             '❌ Rejected',
  disbursement_pending: '💳 Disbursement Pending',
  disbursed:            '💰 Disbursed',
};

type Step = 'eligibility' | 'form' | 'documents' | 'confirm' | 'success';

export default function CitizenWelfarePage() {
  const user = useAuthStore(s => s.user);

  // ─── Data ──────────────────────────────────────────────────────────────────
  const [schemes,    setSchemes]    = useState<WelfareScheme[]>([]);
  const [myApps,     setMyApps]     = useState<WelfareApplication[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('');

  // ─── Apply flow ────────────────────────────────────────────────────────────
  const [selected,     setSelected]     = useState<WelfareScheme | null>(null);
  const [config,       setConfig]       = useState<WelfareSchemeConfig | null>(null);
  const [showInfo,     setShowInfo]     = useState(false);
  const [step,         setStep]         = useState<Step>('eligibility');
  const [formValues,   setFormValues]   = useState<Record<string, string>>({});
  const [files,        setFiles]        = useState<Record<string, File | null>>({});
  const [fileErrors,   setFileErrors]   = useState<Record<string, string>>({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submittedApp, setSubmittedApp] = useState<WelfareApplication | null>(null);

  // ─── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, [user?.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sc, ap] = await Promise.all([
        welfareApi.getSchemes(),
        user?.id ? welfareApi.getApplications(user.id) : Promise.resolve([]),
      ]);
      setSchemes(sc);
      setMyApps(ap);
    } catch (e) { toast.error('Failed to load welfare data'); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('Refreshed');
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const searchQ = useSearchStore(s => s.query).trim().toLowerCase();

  const filtered = schemes.filter(s =>
    s.status === 'active'
    && (!filter || s.category === filter)
    && (!searchQ
      || s.name.toLowerCase().includes(searchQ)
      || s.category.toLowerCase().includes(searchQ)
      || s.description.toLowerCase().includes(searchQ)
      || s.benefits.toLowerCase().includes(searchQ))
  );
  const categories = [...new Set(schemes.map(s => s.category))];

  const alreadyApplied = (schemeId: string) =>
    myApps.some(a => a.schemeId === schemeId && a.status !== 'rejected');

  const eligibilityResults = config && formValues
    ? evaluateEligibility(config, formValues)
    : [];
  const eligible = canSubmit(eligibilityResults);

  // ─── Open apply flow ───────────────────────────────────────────────────────
  const openApply = (s: WelfareScheme) => {
    const cfg = getWelfareConfig(s.id);
    setSelected(s);
    setConfig(cfg ?? null);
    setFormValues({});
    setFiles({});
    setFileErrors({});
    setStep('eligibility');
    setSubmittedApp(null);
  };

  const closeApply = () => {
    setSelected(null);
    setConfig(null);
    setStep('eligibility');
    setSubmittedApp(null);
  };

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileUpload = useCallback((docName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docName]: file }));
    setFileErrors(prev => { const n = { ...prev }; delete n[docName]; return n; });
  }, []);

  // ─── Validate documents step ───────────────────────────────────────────────
  const validateDocuments = (): boolean => {
    if (!config) return false;
    const errs: Record<string, string> = {};
    for (const doc of config.requiredDocuments) {
      if (!files[doc]) errs[doc] = `${doc} is required`;
    }
    setFileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selected || !config || !user) return;
    setSubmitting(true);
    try {
      const uploadedFiles: Record<string, File> = {};
      for (const doc of config.requiredDocuments) {
        if (files[doc]) uploadedFiles[doc] = files[doc]!;
      }
      // Optional docs
      for (const doc of config.optionalDocuments) {
        if (files[doc]) uploadedFiles[doc] = files[doc]!;
      }

      const app = await welfareApi.submit({
        schemeId:          selected.id,
        citizenId:         user.id,
        citizenName:       user.name,
        ward:              user.ward ?? 'Ward 1',
        formData:          formValues,
        files:             uploadedFiles,
        eligibilityResult: eligibilityResults.map(r => `${r.passed ? '✓' : '✗'} ${r.label}`),
      });

      setMyApps(prev => [app, ...prev.filter(a => a.schemeId !== selected.id)]);
      setSubmittedApp(app);
      setStep('success');
      toast.success(`${selected.name} — Application submitted!`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isApplyModalOpen = !!selected && !showInfo && step !== 'success';
  const isSuccessOpen    = !!selected && step === 'success';

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="Welfare Schemes" subtitle="Government benefits & social welfare" />

      <div className="p-6 space-y-6">

        {/* ── My Applications — UNCHANGED DESIGN ── */}
        {myApps.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">My Applications</h3>
              <button onClick={handleRefresh} disabled={refreshing}
                className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors">
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-2">
              {myApps.map(a => (
                <div key={a.id} className="p-3 bg-slate-800/40 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{a.schemeName}</p>
                      <p className="text-xs text-slate-500">{a.appId} · {a.submittedAt}</p>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                  {/* Disbursement details */}
                  {(a.status === 'approved' || a.status === 'disbursed' || a.status === 'disbursement_pending') && (
                    <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1 text-xs">
                      {a.disbursementAmount && (
                        <p className="text-emerald-400">💰 Benefit: ₹{a.disbursementAmount.toLocaleString()}</p>
                      )}
                      {a.disbursedAt && (
                        <p className="text-emerald-400">📅 Disbursed: {a.disbursedAt}</p>
                      )}
                      {a.disbursementReference && (
                        <p className="text-teal-400">🔖 Ref: {a.disbursementReference}</p>
                      )}
                    </div>
                  )}
                  {a.status === 'rejected' && a.rejectionReason && (
                    <p className="mt-1 text-xs text-red-400">Reason: {a.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Category Filter — UNCHANGED ── */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${!filter ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 border border-white/10 hover:text-white'}`}>
            All
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === c ? 'bg-teal-600 text-white' : 'bg-slate-800/60 text-slate-400 border border-white/10 hover:text-white'}`}>
              {CAT_EMOJI[c]} {c}
            </button>
          ))}
        </div>

        {/* ── Scheme Grid — UNCHANGED DESIGN ── */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading schemes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No schemes match your search.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const applied = alreadyApplied(s.id);
              return (
                <div key={s.id}
                  className="glass rounded-2xl p-5 border border-white/5 hover:border-teal-500/20 transition-all cursor-pointer"
                  onClick={() => { setSelected(s); setShowInfo(true); }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-2xl">{CAT_EMOJI[s.category] ?? '🏛️'}</span>
                      <p className="text-white font-medium text-sm mt-1 leading-tight">{s.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${CAT_COLORS[s.category] ?? 'bg-slate-500/15 text-slate-400'}`}>
                      {s.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{s.description}</p>
                  <div className="bg-emerald-500/10 rounded-lg px-3 py-2 text-xs text-emerald-400 mb-3">
                    {s.benefits}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">👥 {s.beneficiariesCount.toLocaleString()} beneficiaries</span>
                    {applied ? (
                      <span className="text-xs text-teal-400 font-medium">✓ Already Applied</span>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); openApply(s); }}
                        className="text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors font-medium">
                        Apply
                      </button>
                    )}
                  </div>
                  {s.applicationDeadline && (
                    <p className="text-xs text-amber-400 mt-2">⏰ Deadline: {s.applicationDeadline}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Scheme Info Modal — UNCHANGED ── */}
      <Modal isOpen={showInfo && !!selected} onClose={() => { setShowInfo(false); setSelected(null); }}
        title={selected?.name ?? ''} size="md">
        {selected && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 font-medium mb-1">Benefits</p>
              <p className="text-sm text-white">{selected.benefits}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Eligibility Criteria</p>
              <ul className="space-y-1.5">
                {selected.eligibility.map(e => (
                  <li key={e} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" /> {e}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Required Documents</p>
              <ul className="space-y-1.5">
                {selected.documentsRequired.map(d => (
                  <li key={d} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </div>
            {!alreadyApplied(selected.id) && (
              <button onClick={() => { setShowInfo(false); openApply(selected); }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Apply Now
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Apply Flow Modal (multi-step) ── */}
      <Modal isOpen={isApplyModalOpen} onClose={closeApply}
        title={selected ? `Apply — ${selected.name}` : ''}
        size="xl">
        {selected && config && (
          <div className="space-y-5">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {(['eligibility','form','documents','confirm'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                    step === s ? 'bg-teal-500 ring-2 ring-teal-500/30 scale-125' :
                    ['eligibility','form','documents','confirm'].indexOf(step) > i ? 'bg-teal-500' : 'bg-slate-700'
                  }`} />
                  {i < 3 && <div className={`flex-1 h-0.5 ${['eligibility','form','documents','confirm'].indexOf(step) > i ? 'bg-teal-500' : 'bg-slate-700'}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-teal-400 font-medium capitalize">{step.replace('_', ' ')}</p>

            {/* ─ STEP 1: Eligibility Check ─ */}
            {step === 'eligibility' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Fill in the details below to check your eligibility for this scheme.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {config.applicationFields
                    .filter(f => config.eligibilityCriteria.some(c => c.fieldKey === f.name))
                    .map(field => (
                      <DynamicFormField key={field.name} field={field}
                        value={formValues[field.name] ?? ''}
                        onChange={handleFieldChange} />
                    ))}
                </div>

                {/* Results */}
                {eligibilityResults.length > 0 && (
                  <div className="glass rounded-xl p-4 border border-white/10 space-y-2">
                    <p className="text-sm font-semibold text-white mb-2">Eligibility Check</p>
                    {eligibilityResults.map(r => (
                      <div key={r.id} className="flex items-start gap-2.5">
                        {r.passed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          : <XCircle className={`w-4 h-4 shrink-0 mt-0.5 ${r.required ? 'text-red-400' : 'text-slate-500'}`} />
                        }
                        <div>
                          <p className={`text-sm ${r.passed ? 'text-emerald-400' : r.required ? 'text-red-400' : 'text-slate-500'}`}>
                            {r.label}
                          </p>
                          {!r.passed && r.hint && (
                            <p className="text-xs text-slate-500 mt-0.5">{r.hint}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {!eligible && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-xs text-red-400">
                        You do not meet all mandatory eligibility criteria. You cannot apply for this scheme.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={closeApply}
                    className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm">
                    Cancel
                  </button>
                  <button onClick={() => setStep('form')} disabled={!eligible}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─ STEP 2: Application Form ─ */}
            {step === 'form' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {config.applicationFields.map(field => (
                    <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <DynamicFormField field={field}
                        value={formValues[field.name] ?? ''}
                        onChange={handleFieldChange} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep('eligibility')}
                    className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm">
                    Back
                  </button>
                  <button onClick={() => setStep('documents')}
                    disabled={!config.applicationFields.filter(f => f.required).every(f => (formValues[f.name] ?? '').trim().length > 0)}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    Next: Documents <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─ STEP 3: Document Upload ─ */}
            {step === 'documents' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-3">
                    Required Documents
                    <span className="text-xs text-slate-500 font-normal ml-2">PDF/JPG/PNG · max 5MB</span>
                  </p>
                  <div className="space-y-2">
                    {config.requiredDocuments.map(doc => (
                      <DocumentUploader key={doc} docName={doc} required
                        onUpload={handleFileUpload} uploadedFile={files[doc]} error={fileErrors[doc]} />
                    ))}
                  </div>
                </div>
                {config.optionalDocuments.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Optional Documents</p>
                    <div className="space-y-2">
                      {config.optionalDocuments.map(doc => (
                        <DocumentUploader key={doc} docName={doc} required={false}
                          onUpload={handleFileUpload} uploadedFile={files[doc]} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep('form')}
                    className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm">
                    Back
                  </button>
                  <button onClick={() => { if (validateDocuments()) setStep('confirm'); }}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                    Review & Confirm <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─ STEP 4: Confirmation ─ */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="glass rounded-xl p-4 border border-white/10 space-y-3 text-sm">
                  {[
                    ['Applicant', user?.name ?? '—'],
                    ['Ward', user?.ward ?? '—'],
                    ['Scheme', selected.name],
                    ['Processing Time', `${config.processingDays} working days`],
                    ['Expected Benefit', selected.benefits],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-slate-500 shrink-0">{k}</span>
                      <span className="text-white text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Eligibility summary */}
                <div className="glass rounded-xl p-3 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium mb-2">Eligibility</p>
                  <div className="space-y-1">
                    {eligibilityResults.map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs">
                        {r.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        <span className={r.passed ? 'text-emerald-400' : 'text-slate-500'}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents summary */}
                <div className="glass rounded-xl p-3 border border-violet-500/20">
                  <p className="text-xs text-violet-400 font-medium mb-2">Documents</p>
                  <div className="space-y-1">
                    {config.requiredDocuments.map(doc => (
                      <div key={doc} className="flex items-center gap-2 text-xs">
                        {files[doc]
                          ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span className="text-emerald-400">{doc}</span><span className="text-slate-500 ml-auto">{files[doc]!.name}</span></>
                          : <><XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /><span className="text-red-400">{doc} — missing</span></>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  By submitting, you confirm all information is accurate. False declarations may result in rejection.
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setStep('documents')}
                    className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm">
                    Back
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting…
                      </span>
                    ) : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Success Modal ── */}
      <Modal isOpen={isSuccessOpen} onClose={closeApply} title="Application Submitted" size="md">
        {submittedApp && selected && config && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Application Submitted Successfully</h3>
            </div>
            <div className="glass rounded-xl p-4 border border-emerald-500/20 space-y-3 text-sm">
              {[
                ['Application No.',      submittedApp.appId],
                ['Scheme',               submittedApp.schemeName],
                ['Status',               'Submitted'],
                ['Processing Time',      `${config.processingDays} working days`],
                ['Expected Benefit',     selected.benefits],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className={`text-right font-medium ${k === 'Application No.' ? 'text-teal-400 font-mono' : 'text-white'}`}>{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 text-center">
              You will be notified when your application status changes. Track it in the My Applications section above.
            </p>
            <button onClick={closeApply}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold">
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

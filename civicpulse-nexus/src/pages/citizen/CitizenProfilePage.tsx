import { useState, useRef, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Lock,
  Camera, CheckCircle, AlertCircle, Eye, EyeOff, Save,
} from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Input, Select } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const GENDER_OPTS = [
  { value: '', label: 'Select gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const WARD_OPTS = Array.from({ length: 20 }, (_, i) => ({
  value: `Ward ${i + 1}`, label: `Ward ${i + 1}`,
}));

// ─── Validators ───────────────────────────────────────────────────────────────
const validatePhone   = (v: string) => /^[6-9]\d{9}$/.test(v);
const validateEmail   = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePincode = (v: string) => /^[1-9][0-9]{5}$/.test(v);
const passwordStrength = (p: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (p.length >= 8)              score++;
  if (/[A-Z]/.test(p))            score++;
  if (/[0-9]/.test(p))            score++;
  if (/[^A-Za-z0-9]/.test(p))     score++;
  if (p.length >= 12)             score++;
  const map = [
    { label: 'Very Weak', color: 'bg-red-500'    },
    { label: 'Weak',      color: 'bg-orange-500' },
    { label: 'Fair',      color: 'bg-amber-500'  },
    { label: 'Good',      color: 'bg-teal-500'   },
    { label: 'Strong',    color: 'bg-emerald-500' },
  ];
  return { score, ...map[Math.min(score, 4)] };
};

type Section = 'personal' | 'contact' | 'address' | 'password';

export default function CitizenProfilePage() {
  const { user, profileLoading, updateProfile, changePassword, uploadAvatar, loadProfile } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [saved, setSaved] = useState<Section | null>(null);

  // Form states
  const [personal, setPersonal] = useState({
    name:        user?.name        ?? '',
    gender:      user?.gender      ?? '',
    dateOfBirth: user?.dateOfBirth ?? '',
  });
  const [contact, setContact] = useState({
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  });
  const [address, setAddress] = useState({
    address:  user?.address  ?? '',
    city:     user?.city     ?? '',
    district: user?.district ?? '',
    state:    user?.state    ?? '',
    pincode:  user?.pincode  ?? '',
    ward:     user?.ward     ?? '',
  });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load fresh profile on mount
  useEffect(() => {
    if (user?.id) loadProfile(user.id);
  }, [user?.id]);

  // Sync form when user updates
  useEffect(() => {
    if (!user) return;
    setPersonal({ name: user.name ?? '', gender: user.gender ?? '', dateOfBirth: user.dateOfBirth ?? '' });
    setContact({ phone: user.phone ?? '', email: user.email ?? '' });
    setAddress({ address: user.address ?? '', city: user.city ?? '', district: user.district ?? '', state: user.state ?? '', pincode: user.pincode ?? '', ward: user.ward ?? '' });
  }, [user]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, WebP allowed'); return;
    }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    try {
      await uploadAvatar(user.id, file);
      toast.success('Profile photo updated');
    } catch (e: any) { toast.error(e?.message ?? 'Upload failed'); }
  };

  const savePersonal = async () => {
    const errs: Record<string, string> = {};
    if (!personal.name.trim()) errs.name = 'Name is required';
    if (personal.name.trim().length < 2) errs.name = 'Name too short';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await updateProfile(user!.id, { name: personal.name.trim(), gender: personal.gender, dateOfBirth: personal.dateOfBirth || undefined });
      setSaved('personal'); setTimeout(() => setSaved(null), 3000);
      toast.success('Personal details updated');
    } catch (e: any) { toast.error(e?.message ?? 'Update failed'); }
  };

  const saveContact = async () => {
    const errs: Record<string, string> = {};
    if (contact.phone && !validatePhone(contact.phone)) errs.phone = 'Invalid phone (10 digits, starts 6-9)';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await updateProfile(user!.id, { phone: contact.phone });
      setSaved('contact'); setTimeout(() => setSaved(null), 3000);
      toast.success('Contact details updated');
    } catch (e: any) { toast.error(e?.message ?? 'Update failed'); }
  };

  const saveAddress = async () => {
    const errs: Record<string, string> = {};
    if (address.pincode && !validatePincode(address.pincode)) errs.pincode = 'Invalid pincode (6 digits)';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await updateProfile(user!.id, { ...address, pincode: address.pincode || undefined });
      setSaved('address'); setTimeout(() => setSaved(null), 3000);
      toast.success('Address updated');
    } catch (e: any) { toast.error(e?.message ?? 'Update failed'); }
  };

  const savePassword = async () => {
    const errs: Record<string, string> = {};
    if (!pwd.current)          errs.current = 'Current password required';
    if (pwd.newPwd.length < 8) errs.newPwd  = 'Min 8 characters';
    if (!/[A-Z]/.test(pwd.newPwd)) errs.newPwd = 'Must contain uppercase letter';
    if (!/[0-9]/.test(pwd.newPwd)) errs.newPwd = (errs.newPwd ? errs.newPwd + ' and' : 'Must contain') + ' a digit';
    if (pwd.newPwd !== pwd.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      await changePassword(user!.id, { currentPassword: pwd.current, newPassword: pwd.newPwd });
      setPwd({ current: '', newPwd: '', confirm: '' });
      setSaved('password'); setTimeout(() => setSaved(null), 3000);
      toast.success('Password changed successfully');
    } catch (e: any) { toast.error(e?.message ?? 'Password change failed'); }
  };

  const strength = passwordStrength(pwd.newPwd);

  const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal Info',  icon: User    },
    { id: 'contact',  label: 'Contact',        icon: Phone   },
    { id: 'address',  label: 'Address',        icon: MapPin  },
    { id: 'password', label: 'Password',       icon: Lock    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar title="My Profile" subtitle="Manage your account & settings" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">

        {/* ── Profile Header ── */}
        <div className="glass rounded-2xl p-6 flex items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : user.name[0].toUpperCase()
              }
            </div>
            <button onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-600 hover:bg-teal-500 rounded-xl flex items-center justify-center transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleAvatarChange} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.ward && <span className="text-xs bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded-full">{user.ward}</span>}
              {user.phone && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{user.phone}</span>}
              <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
            </div>
          </div>

          {profileLoading && (
            <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin shrink-0" />
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* ── Section Nav ── */}
          <div className="glass rounded-2xl p-3 h-fit space-y-1">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.id
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
                {saved === s.id && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
              </button>
            ))}
          </div>

          {/* ── Section Content ── */}
          <div className="lg:col-span-3 glass rounded-2xl p-6 space-y-5">

            {/* PERSONAL */}
            {activeSection === 'personal' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-semibold text-white">Personal Information</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={personal.name} placeholder="Your full name"
                    error={errors.name}
                    onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} />
                  <Select label="Gender" value={personal.gender} options={GENDER_OPTS}
                    onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Date of Birth</label>
                    <input type="date" value={personal.dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Citizen ID</label>
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed">
                      {user.id} — read-only
                    </div>
                  </div>
                </div>
                <button onClick={savePersonal} disabled={profileLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" /> Save Personal Info
                </button>
              </>
            )}

            {/* CONTACT */}
            {activeSection === 'contact' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-semibold text-white">Contact Details</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Mobile Number" value={contact.phone} placeholder="10-digit mobile"
                    error={errors.phone}
                    onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Email Address</label>
                    <div className="relative">
                      <input value={contact.email} readOnly
                        className="w-full bg-slate-800/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">locked</span>
                    </div>
                    <p className="text-xs text-slate-600">Contact support to change email</p>
                  </div>
                </div>
                <button onClick={saveContact} disabled={profileLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" /> Save Contact
                </button>
              </>
            )}

            {/* ADDRESS */}
            {activeSection === 'address' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-semibold text-white">Address</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Street Address</label>
                    <textarea rows={2} value={address.address} placeholder="House no, Street, Area"
                      onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="City" value={address.city} placeholder="City"
                      onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} />
                    <Input label="District" value={address.district} placeholder="District"
                      onChange={e => setAddress(a => ({ ...a, district: e.target.value }))} />
                    <Input label="State" value={address.state} placeholder="State"
                      onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} />
                    <Input label="Pincode" value={address.pincode} placeholder="6-digit pincode"
                      error={errors.pincode}
                      onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))} />
                    <Select label="Ward" value={address.ward}
                      options={[{ value: '', label: 'Select Ward' }, ...WARD_OPTS]}
                      onChange={e => setAddress(a => ({ ...a, ward: e.target.value }))} />
                  </div>
                </div>
                <button onClick={saveAddress} disabled={profileLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" /> Save Address
                </button>
              </>
            )}

            {/* PASSWORD */}
            {activeSection === 'password' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-semibold text-white">Change Password</h3>
                </div>
                <div className="space-y-4 max-w-sm">
                  {/* Current password */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Current Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type={showPwd.current ? 'text' : 'password'} value={pwd.current}
                        onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                        className={`w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${errors.current ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30'}`} />
                      <button type="button" onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.current && <p className="text-xs text-red-400">{errors.current}</p>}
                  </div>

                  {/* New password */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">New Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type={showPwd.new ? 'text' : 'password'} value={pwd.newPwd}
                        onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))}
                        className={`w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${errors.newPwd ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30'}`} />
                      <button type="button" onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwd.newPwd && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[0,1,2,3,4].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i < strength.score ? strength.color : 'bg-slate-700'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">{strength.label}</p>
                      </div>
                    )}
                    {errors.newPwd && <p className="text-xs text-red-400">{errors.newPwd}</p>}
                    <ul className="text-xs text-slate-500 space-y-0.5 mt-1">
                      {[
                        ['Min 8 characters', pwd.newPwd.length >= 8],
                        ['One uppercase letter', /[A-Z]/.test(pwd.newPwd)],
                        ['One digit', /[0-9]/.test(pwd.newPwd)],
                      ].map(([label, ok]) => (
                        <li key={label as string} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {ok ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {label as string}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confirm */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">Confirm New Password <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type={showPwd.confirm ? 'text' : 'password'} value={pwd.confirm}
                        onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                        className={`w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${errors.confirm ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30'}`} />
                      <button type="button" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwd.confirm && pwd.newPwd === pwd.confirm && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>
                    )}
                    {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
                  </div>
                </div>

                <button onClick={savePassword} disabled={profileLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors mt-2">
                  <Lock className="w-4 h-4" /> Change Password
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

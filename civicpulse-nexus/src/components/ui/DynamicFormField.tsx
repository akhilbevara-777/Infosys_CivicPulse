import type { FormField } from '../../config/serviceConfig';

interface Props {
  field: FormField;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
}

const inputCls = (hasErr: boolean) =>
  `w-full bg-slate-800/60 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
    hasErr ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50'
  }`;

export function DynamicFormField({ field, value, onChange, error }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(field.name, e.target.value);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {field.type === 'select' && field.options ? (
        <select value={value} onChange={handleChange} className={inputCls(!!error)}>
          <option value="" className="bg-slate-800">Select {field.label}</option>
          {field.options.map(o => (
            <option key={o} value={o} className="bg-slate-800">{o}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={handleChange}
          rows={3}
          placeholder={field.placeholder}
          className={`${inputCls(!!error)} resize-none`}
        />
      ) : (
        <input
          type={
            field.type === 'aadhaar' ? 'text'
            : field.type === 'phone'  ? 'tel'
            : field.type === 'number' ? 'number'
            : field.type === 'date'   ? 'date'
            : 'text'
          }
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder ?? (field.type === 'aadhaar' ? 'XXXX-XXXX-XXXX' : field.type === 'phone' ? '10-digit mobile' : '')}
          min={field.min !== undefined ? String(field.min) : undefined}
          max={field.max !== undefined ? String(field.max) : undefined}
          className={inputCls(!!error)}
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

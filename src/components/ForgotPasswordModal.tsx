import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { CloseIcon } from './icons';

const inputClass = 'border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]';
const labelClass = 'text-[11px] text-[#7a8097] grid gap-1';

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleRequestSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await authService.requestPasswordReset(identifier);
    if (result.ok) {
      toast(`کد بازیابی (نمایش موقت تا سرویس پیامک/ایمیل وصل شود): ${result.simulatedCode}`, { duration: 15000 });
      setStep('reset');
    } else {
      toast.error(result.error);
    }
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== newPasswordRepeat) {
      toast.error('رمز عبور و تکرارش یکسان نیستند');
      return;
    }
    const result = await authService.resetPassword(identifier, code, newPassword);
    if (result.ok) {
      toast.success('رمز عبور تغییر کرد');
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[400px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="forgot-password-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="forgot-password-title" className="text-[15px] font-bold mb-4">بازیابی رمز عبور</h2>

      {step === 'request' ? <form onSubmit={handleRequestSubmit} className="grid gap-[10px]">
        <label className={labelClass}>ایمیل یا شماره موبایل
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} className={inputClass} required />
        </label>
        <button type="submit" className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 cursor-pointer">ارسال کد بازیابی</button>
      </form> : <form onSubmit={handleResetSubmit} className="grid gap-[10px]">
        <label className={labelClass}>کد بازیابی
          <input type="text" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>رمز عبور جدید
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>تکرار رمز عبور جدید
          <input type="password" value={newPasswordRepeat} onChange={e => setNewPasswordRepeat(e.target.value)} className={inputClass} required />
        </label>
        <button type="submit" className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 cursor-pointer">تغییر رمز عبور</button>
      </form>}
    </section>
  </div>;
}

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import type { User } from '../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';

const inputClass = 'border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]';
const labelClass = 'text-[11px] text-[#7a8097] grid gap-1';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordRepeat, setSignupPasswordRepeat] = useState('');

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await authService.logIn({ identifier: loginIdentifier, password: loginPassword });
    if (result.ok) {
      onAuthenticated(result.user);
    } else {
      toast.error(result.error);
    }
  };

  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signupPassword !== signupPasswordRepeat) {
      toast.error('رمز عبور و تکرارش یکسان نیستند');
      return;
    }
    const result = await authService.signUp({
      fullName: signupFullName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
    });
    if (result.ok) {
      toast.success('ثبت‌نام با موفقیت انجام شد');
      onAuthenticated(result.user);
    } else {
      toast.error(result.error);
    }
  };

  return <div className="min-h-screen bg-[#f5f6fb] grid place-items-center p-4">
    <section className="bg-white rounded-[20px] p-6 w-full max-w-[400px] shadow-[0_12px_36px_#2734790b] border border-[#eceef8]">
      <h1 className="text-[20px] font-bold text-center mb-1 text-[#5264e8]">Oracle</h1>
      <p className="text-[11px] text-[#969eb2] text-center mb-5">سرمایه‌های من</p>

      <div className="grid grid-cols-2 mb-5 border border-[#eef0f7] rounded-[10px] p-1">
        <button type="button" onClick={() => setTab('login')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${tab === 'login' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}>ورود</button>
        <button type="button" onClick={() => setTab('signup')} className={`text-[13px] font-medium rounded-[8px] py-1.5 cursor-pointer transition-colors ${tab === 'signup' ? 'bg-[#5264e8] text-white' : 'text-[#7a8097]'}`}>ثبت‌نام</button>
      </div>

      {tab === 'login' ? <form onSubmit={handleLoginSubmit} className="grid gap-[10px]">
        <label className={labelClass}>ایمیل یا شماره موبایل
          <input type="text" name="identifier" id="login-identifier" autoComplete="username" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>رمز عبور
          <input type="password" name="password" id="login-password" autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={inputClass} required />
        </label>
        <button type="submit" className="bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 mt-1 cursor-pointer">ورود</button>
        <button type="button" onClick={() => setIsForgotOpen(true)} className="text-[11px] text-[#5264e8] justify-self-center cursor-pointer hover:underline">رمز عبور را فراموش کرده‌اید؟</button>
      </form> : <form onSubmit={handleSignupSubmit} className="grid gap-[10px]">
        <label className={labelClass}>نام و نام خانوادگی
          <input type="text" name="fullName" id="signup-fullname" autoComplete="name" value={signupFullName} onChange={e => setSignupFullName(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>ایمیل
          <input type="email" name="email" id="signup-email" autoComplete="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>شماره موبایل
          <input type="tel" name="phone" id="signup-phone" autoComplete="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>رمز عبور
          <input type="password" name="password" id="signup-password" autoComplete="new-password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className={inputClass} required />
        </label>
        <label className={labelClass}>تکرار رمز عبور
          <input type="password" name="passwordRepeat" id="signup-password-repeat" autoComplete="new-password" value={signupPasswordRepeat} onChange={e => setSignupPasswordRepeat(e.target.value)} className={inputClass} required />
        </label>
        <button type="submit" className="bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 mt-1 cursor-pointer">ثبت‌نام</button>
      </form>}
    </section>
    {isForgotOpen && <ForgotPasswordModal onClose={() => setIsForgotOpen(false)}/>}
  </div>;
}

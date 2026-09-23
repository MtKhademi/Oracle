import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { profileService } from '../services/profileService';
import type { Profile } from '../types';
import { CloseIcon, UserAvatarPlaceholderIcon } from './icons';

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    profileService.getProfile().then((profile: Profile) => {
      setFullName(profile.fullName);
      setPhone(profile.phone);
      setEmail(profile.email);
      setAvatarDataUrl(profile.avatarDataUrl);
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatarDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const profile: Profile = { fullName, phone, email, avatarDataUrl };
    await profileService.saveProfile(profile);
    toast.success('مشخصات ذخیره شد');
    onClose();
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
    <section className="bg-white rounded-[20px] p-5 w-full max-w-[440px] max-h-[90vh] overflow-y-auto shadow-[0_12px_36px_#2734790b] border border-[#eceef8] relative max-[481px]:rounded-[16px] max-[481px]:p-4" aria-labelledby="profile-title" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 id="profile-title" className="text-[15px] font-bold mb-4">مشخصات</h2>
      <div className="flex flex-col items-center gap-2 mb-5">
        <span className="w-20 h-20 rounded-full bg-[#eef0ff] text-[#5264e8] grid place-items-center overflow-hidden shrink-0">
          {avatarDataUrl ? <img src={avatarDataUrl} alt="آواتار" className="w-full h-full object-cover"/> : <UserAvatarPlaceholderIcon/>}
        </span>
        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" aria-hidden="true" tabIndex={-1} />
        <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-[11px] font-medium text-[#5264e8] bg-[#eef0ff] rounded-[10px] px-3 py-1.5 cursor-pointer hover:bg-[#e2e5ff] transition-colors">تغییر عکس</button>
      </div>
      <div className="grid gap-[10px]">
        <label className="text-[11px] text-[#7a8097] grid gap-1">نام و نام خانوادگی
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">شماره تماس
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <label className="text-[11px] text-[#7a8097] grid gap-1">ایمیل
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border border-[#eef0f7] rounded-[10px] px-3 py-2 text-[13px] text-[#2a2f3d]" />
        </label>
        <button type="button" onClick={handleSave} className="justify-self-start bg-[#5264e8] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 cursor-pointer">ذخیره</button>
      </div>
    </section>
  </div>;
}

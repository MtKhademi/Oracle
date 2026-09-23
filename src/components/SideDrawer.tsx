import { useEffect, useState, type ReactNode } from 'react';
import { CloseIcon, HelpIcon, InfoIcon, LogoutIcon, SettingsIcon, UserIcon } from './icons';

// Placeholder menu items only — none have real functionality yet (no backend/auth
// in this app) except مشخصات, which opens the profile view (see onOpenProfile).
// Clicking any of the others just closes the drawer for now; they're stubs for
// future features (settings page, about page, help page, logout).
const menuItems: { icon: ReactNode; label: string }[] = [
  { icon: <SettingsIcon/>, label: 'تنظیمات' },
  { icon: <InfoIcon/>, label: 'درباره Oracle' },
  { icon: <HelpIcon/>, label: 'راهنما' },
];

export function SideDrawer({ onClose, onOpenProfile }: { onClose: () => void; onOpenProfile: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
    <aside
      className={`absolute top-0 right-0 h-full w-[280px] max-w-[80vw] bg-white shadow-[0_12px_36px_#2734790b] border-l border-[#eceef8] p-5 overflow-y-auto transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      aria-label="منوی اصلی"
      onClick={e => e.stopPropagation()}
    >
      <button type="button" onClick={onClose} aria-label="بستن" className="absolute top-4 left-4 text-[#9096aa] cursor-pointer p-1 rounded-md hover:bg-[#f6f7fb] transition-colors"><CloseIcon/></button>
      <h2 className="text-[15px] font-bold mb-4 mt-1">منو</h2>
      <ul className="list-none m-0 p-0 grid gap-1">
        <li>
          <button type="button" onClick={onOpenProfile} className="w-full flex items-center gap-3 text-[13px] text-[#2a2f3d] rounded-[10px] px-3 py-2 hover:bg-[#f6f7fb] transition-colors">
            <span className="text-[#77809c] shrink-0"><UserIcon/></span>
            مشخصات
          </button>
        </li>
        {menuItems.map(item => <li key={item.label}>
          <button type="button" onClick={onClose} className="w-full flex items-center gap-3 text-[13px] text-[#2a2f3d] rounded-[10px] px-3 py-2 hover:bg-[#f6f7fb] transition-colors">
            <span className="text-[#77809c] shrink-0">{item.icon}</span>
            {item.label}
          </button>
        </li>)}
        <li className="border-t border-[#eef0f7] mt-2 pt-2">
          <button type="button" onClick={onClose} className="w-full flex items-center gap-3 text-[13px] text-[#d95050] rounded-[10px] px-3 py-2 hover:bg-[#fdecec] transition-colors">
            <span className="text-[#d95050] shrink-0"><LogoutIcon/></span>
            خروج
          </button>
        </li>
      </ul>
    </aside>
  </div>;
}

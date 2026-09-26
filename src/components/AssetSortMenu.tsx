import { useEffect, useRef, useState } from 'react';
import { MoreVerticalIcon } from './icons';

export type AssetSortMode = 'value' | 'type';

// Small three-dot icon-only button + dropdown, letting the owner choose how
// the "دارایی‌های من" list is sorted (see App.tsx). Modeled on AssetPicker's
// combobox dropdown (same panel styling), but built as its own component
// since this isn't a searchable combobox — just two radio-style options.
//
// Outside-click detection reuses AssetPicker's `document` `mousedown` +
// container `ref` pattern (NOT a `fixed inset-0` overlay div): a `mousedown`
// listener only *detects* whether the click landed outside this component's
// own DOM subtree and closes the dropdown, it never intercepts/swallows the
// click itself — the same click still reaches whatever else it was aimed at
// (e.g. a parent modal's own backdrop/close button) in the same event
// dispatch. This is deliberate: an earlier real bug in this app came from a
// component's own outside-click overlay blocking a parent modal's close
// behavior (see AssetPicker.tsx's own comment for the original incident) —
// this component must not repeat that mistake.
export function AssetSortMenu({ value, onChange }: { value: AssetSortMode; onChange: (mode: AssetSortMode) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const select = (mode: AssetSortMode) => {
    onChange(mode);
    setIsOpen(false);
  };

  return <div className="relative" ref={containerRef}>
    <button
      type="button"
      onClick={() => setIsOpen(o => !o)}
      aria-label="مرتب‌سازی دارایی‌ها"
      aria-haspopup="true"
      aria-expanded={isOpen}
      className="grid place-items-center rounded-md p-1 text-[#9096aa] hover:bg-[#eef0ff] hover:text-[#5264e8] cursor-pointer transition-colors"
    ><MoreVerticalIcon/></button>
    {isOpen && <div
      role="menu"
      className="absolute z-20 left-0 top-full mt-1 w-[220px] bg-white rounded-[14px] border border-[#eceef8] shadow-[0_12px_36px_#2734790b] p-1"
    >
      <button
        type="button"
        role="menuitemradio"
        aria-checked={value === 'value'}
        onClick={() => select('value')}
        className={`w-full flex items-center justify-between text-right text-[12px] px-3 py-2 rounded-[8px] cursor-pointer ${value === 'value' ? 'bg-[#f0f1fb] text-[#4659d9] font-medium' : 'text-[#2a2f3d] hover:bg-[#f6f7fb]'}`}
      >
        <span>بیشترین ارزش (تومان)</span>
        {value === 'value' && <span aria-hidden="true">✓</span>}
      </button>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={value === 'type'}
        onClick={() => select('type')}
        className={`w-full flex items-center justify-between text-right text-[12px] px-3 py-2 rounded-[8px] cursor-pointer ${value === 'type' ? 'bg-[#f0f1fb] text-[#4659d9] font-medium' : 'text-[#2a2f3d] hover:bg-[#f6f7fb]'}`}
      >
        <span>بر اساس نوع دارایی</span>
        {value === 'type' && <span aria-hidden="true">✓</span>}
      </button>
    </div>}
  </div>;
}

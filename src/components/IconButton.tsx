import type { ReactNode } from 'react';

export type IconButtonTone = 'neutral' | 'danger';
// 'filled' = permanent tinted background + darker hover tint (toolbar buttons).
// 'ghost' = transparent background, tinted background only appears on hover (asset row buttons).
export type IconButtonVariant = 'filled' | 'ghost';

const toneClasses: Record<IconButtonTone, Record<IconButtonVariant, string>> = {
  neutral: {
    filled: 'text-[#5264e8] bg-[#eef0ff] hover:bg-[#e2e5ff]',
    ghost: 'text-[#77809c] hover:bg-[#eef0ff]',
  },
  danger: {
    filled: 'text-[#d95050] bg-[#fdecec] hover:bg-[#fbe0e0]',
    ghost: 'text-[#d95050] hover:bg-[#fdecec]',
  },
};

const variantClasses: Record<IconButtonVariant, string> = {
  filled: 'rounded-[10px] p-2',
  ghost: 'rounded-md p-2',
};

export function IconButton({ icon, onClick, ariaLabel, tone, variant = 'filled' }: {
  icon: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  tone: IconButtonTone;
  variant?: IconButtonVariant;
}) {
  return <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`grid place-items-center aspect-square cursor-pointer transition-colors ${variantClasses[variant]} ${toneClasses[tone][variant]}`}
  >{icon}</button>;
}

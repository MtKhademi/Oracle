import { MonthPicker } from '@novinstack/react-datepicker';
import type { DatePickerValue, PlainCalendarDate } from '@novinstack/react-datepicker';

function parseValue(value?: string): PlainCalendarDate | undefined {
  const match = /^(\d{2})\/(\d{2})$/.exec(value ?? '');
  if (!match) return undefined;
  return { calendar: 'jalali', year: 1400 + Number(match[1]), month: Number(match[2]), day: 1 };
}

export function PersianMonthPicker({ value, onChange, placeholder = 'YY/MM' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <MonthPicker
    value={parseValue(value)}
    calendar="jalali"
    locale="fa-IR"
    numerals="latin"
    valueType="object"
    placeholder={placeholder}
    className="oracle-month-picker"
    theme="minimal"
    portal
    placement="top-end"
    autoFlip
    mobileMode="popover"
    variables={{ primary: '#5264e8', primaryHover: '#4659d9', primaryActive: '#3d4fc7', border: '#eef0f7', radius: 10, fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}
    renderTrigger={({ toggle }) => <button type="button" dir="ltr" onClick={toggle} className="w-full min-w-0 h-[42px] border border-[#eef0f7] rounded-[10px] px-2 text-[13px] text-[#2a2f3d] bg-white text-left cursor-pointer">{value || <span className="text-[#9aa1b4]">{placeholder}</span>}</button>}
    onChange={nextValue => {
      const selected = nextValue as DatePickerValue | null;
      if (!selected) {
        onChange('');
        return;
      }
      onChange(`${String(selected.year).slice(-2)}/${String(selected.month).padStart(2, '0')}`);
    }}
  />;
}

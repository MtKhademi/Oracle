import { DatePicker } from '@novinstack/react-datepicker';
import type { DatePickerValue } from '@novinstack/react-datepicker';

const pickerVariables = {
  primary: '#5264e8',
  primaryHover: '#4659d9',
  primaryActive: '#3d4fc7',
  border: '#eef0f7',
  radius: 10,
  fontFamily: 'Vazirmatn, Tahoma, sans-serif',
};

export function PersianDatePicker({ value, onChange, placeholder = 'انتخاب تاریخ' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <DatePicker
    value={value || undefined}
    calendar="jalali"
    locale="fa-IR"
    numerals="latin"
    valueType="iso"
    displayFormat="YYYY/MM/DD"
    placeholder={placeholder}
    className="oracle-date-picker"
    theme="minimal"
    portal
    placement="top-end"
    autoFlip
    mobileMode="popover"
    variables={pickerVariables}
    renderTrigger={({ toggle, value: displayValue }) => <button type="button" dir="ltr" onClick={toggle} className="w-full min-w-0 h-[42px] border border-[#eef0f7] rounded-[10px] px-3 text-[13px] text-[#2a2f3d] bg-white text-left cursor-pointer">{displayValue || <span className="text-[#9aa1b4]">{placeholder}</span>}</button>}
    onChange={nextValue => {
      if (!nextValue) {
        onChange('');
        return;
      }
      if (typeof nextValue === 'string') {
        onChange(nextValue);
        return;
      }
      onChange((nextValue as DatePickerValue).iso);
    }}
  />;
}

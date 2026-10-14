import { RefreshIcon } from './icons';

export function BackendUnavailableScreen({ isChecking, onRetry }: { isChecking: boolean; onRetry: () => void }) {
  return <main className="min-h-screen bg-[#f5f6fb] grid place-items-center p-5" role="alert">
    <section className="w-full max-w-[420px] bg-white border border-[#eceef8] rounded-[22px] shadow-[0_12px_36px_#2734790b] p-6 text-center grid justify-items-center gap-4">
      <span className="w-14 h-14 rounded-[18px] bg-[#eef0ff] text-[#5264e8] grid place-items-center"><RefreshIcon/></span>
      <div className="grid gap-2">
        <h1 className="m-0 text-[17px] font-bold text-[#2a2f3d]">بک‌اند در دسترس نیست</h1>
        <p className="m-0 text-[12px] leading-6 text-[#7a8097]">اتصال به سرویس Oracle برقرار نشد. از روشن‌بودن بک‌اند و اتصال شبکه مطمئن شوید.</p>
      </div>
      <button type="button" onClick={onRetry} disabled={isChecking} className="inline-flex items-center gap-2 bg-[#5264e8] disabled:bg-[#aeb5f2] text-white text-[12px] font-medium rounded-[12px] px-4 py-2 cursor-pointer disabled:cursor-wait">
        <RefreshIcon/>{isChecking ? 'در حال بررسی...' : 'تلاش مجدد'}
      </button>
    </section>
  </main>;
}

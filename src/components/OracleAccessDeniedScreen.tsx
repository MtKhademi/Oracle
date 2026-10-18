export function OracleAccessDeniedScreen() {
  return <main className="min-h-screen bg-[#f5f6fb] grid place-items-center p-4" dir="rtl">
    <section className="bg-white rounded-[20px] p-6 w-full max-w-[400px] text-center shadow-[0_12px_36px_#2734790b] border border-[#eceef8]">
      <h1 className="text-[16px] font-bold text-[#2a2f3d] mb-2">دسترسی Oracle فعال نیست</h1>
      <p className="text-[12px] leading-7 text-[#7a8097]">حساب شما وارد شده است، اما دسترسی فعال به بخش Oracle ندارد. برای فعال‌سازی دسترسی با مدیر سیستم تماس بگیرید.</p>
    </section>
  </main>;
}

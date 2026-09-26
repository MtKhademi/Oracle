import { useState } from 'react';
import type { Asset } from '../assets';
import { format, maskAmount } from '../format';
import type { LivePrices } from '../services/priceService';
import { getEffectiveUnitPrice, getLivePriceKeyForAsset } from '../services/livePriceMapping';
import { AssetIcon, iconTint } from './AssetIcon';
import { IconButton } from './IconButton';
import { HistoryIcon, PencilIcon, TrashIcon } from './icons';

const assetIconBase = 'w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] [@media(min-width:351px)_and_(max-width:480px)]:w-[41px] [@media(min-width:351px)_and_(max-width:480px)]:h-[41px] max-[351px]:w-[35px] max-[351px]:h-[35px]';

export function AssetRow({ asset, prices, isBalanceHidden, onDelete, onEdit, onHistory }: { asset: Asset; prices: LivePrices | null; isBalanceHidden: boolean; onDelete: (id: string) => void; onEdit: (id: string, quantity: number, unitPrice: number) => void; onHistory: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState(String(asset.quantity));
  const [draftUnitPrice, setDraftUnitPrice] = useState(String(asset.unitPrice));
  const [error, setError] = useState<string | null>(null);

  const livePriceKey = getLivePriceKeyForAsset(asset);
  const effectiveUnitPrice = getEffectiveUnitPrice(asset, prices);

  const startEdit = () => {
    setDraftQuantity(String(asset.quantity));
    setDraftUnitPrice(String(asset.unitPrice));
    setError(null);
    setIsEditing(true);
  };

  const save = () => {
    const quantity = Number(draftQuantity);
    if (!Number.isFinite(quantity)) {
      setError('عدد نامعتبر است.');
      return;
    }
    if (livePriceKey) {
      // Live-priced assets aren't manually price-edited — keep the stored
      // unitPrice untouched (it isn't used for display on this asset, but
      // keeping it intact avoids losing data).
      onEdit(asset.id, quantity, asset.unitPrice);
      setIsEditing(false);
      return;
    }
    const unitPrice = Number(draftUnitPrice);
    if (!Number.isFinite(unitPrice)) {
      setError('عدد نامعتبر است.');
      return;
    }
    onEdit(asset.id, quantity, unitPrice);
    setIsEditing(false);
  };

  return <li className="bg-white border border-[#eef0f7] rounded-[17px] flex items-start gap-[15px] py-[12px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:py-[10px] min-[1050px]:px-[14px] [@media(min-width:351px)_and_(max-width:480px)]:gap-[12px] [@media(min-width:351px)_and_(max-width:480px)]:py-[11px] [@media(min-width:351px)_and_(max-width:480px)]:px-[14px] max-[351px]:gap-[9px] max-[351px]:py-[10px] max-[351px]:px-[10px]">
    <span className={`${assetIconBase} ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
    <div className="flex-1 min-w-0">
      <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{asset.name}</h3>
      {isEditing ? <div className="flex flex-wrap items-center gap-[6px] mt-[6px]">
        <input type="number" step="any" value={draftQuantity} onChange={e => setDraftQuantity(e.target.value)} className="w-[90px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`مقدار ${asset.name}`} />
        <span className="text-[11px] text-[#999fb2]">{asset.unit}</span>
        {livePriceKey ? <span className="text-[10px] text-[#5264e8] bg-[#eef0ff] rounded-[8px] px-2 py-1">قیمت زنده</span> : <input type="number" step="any" value={draftUnitPrice} onChange={e => setDraftUnitPrice(e.target.value)} className="w-[110px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`قیمت واحد ${asset.name} به تومان`} />}
        {error && <span className="text-[10px] text-[#d95050] w-full">{error}</span>}
      </div> : <>
        <p className="text-[11px] text-[#999fb2] mt-[5px]">{format(asset.quantity, 8)} {asset.unit}</p>
        {livePriceKey && prices && <p className="text-[10px] text-[#a2a8b9] mt-[2px]">{format(effectiveUnitPrice)} تومان / {asset.unit}</p>}
      </>}
    </div>
    <div className="text-left shrink-0 flex flex-col gap-[6px] items-end">
      {!isEditing && <div className="flex items-baseline gap-[6px]"><strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] [@media(min-width:351px)_and_(max-width:480px)]:text-[14px] max-[351px]:text-[12px]">{isBalanceHidden ? maskAmount(format(asset.quantity * effectiveUnitPrice)) : format(asset.quantity * effectiveUnitPrice)}</strong><span className="text-[#a2a8b9] text-[10px]">تومان</span></div>}
      <div className="flex gap-[8px]">
        {isEditing ? <>
          <button type="button" onClick={save} className="text-[10px] font-medium text-white bg-[#5264e8] rounded-[8px] px-2 py-1">ذخیره</button>
          <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] text-[#9096aa] border border-[#eef0f7] rounded-[8px] px-2 py-1">انصراف</button>
        </> : <>
          <IconButton icon={<HistoryIcon/>} onClick={() => onHistory(asset.id)} ariaLabel="تاریخچه" tone="neutral" variant="ghost"/>
          <IconButton icon={<PencilIcon/>} onClick={startEdit} ariaLabel="ویرایش" tone="neutral" variant="ghost"/>
          <IconButton icon={<TrashIcon/>} onClick={() => onDelete(asset.id)} ariaLabel="حذف" tone="danger" variant="ghost"/>
        </>}
      </div>
    </div>
  </li>;
}

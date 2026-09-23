import { useState } from 'react';
import type { Asset } from '../assets';
import { format } from '../format';
import { AssetIcon, iconTint } from './AssetIcon';
import { IconButton } from './IconButton';
import { PencilIcon, TrashIcon } from './icons';

const assetIconBase = 'w-[46px] h-[46px] shrink-0 grid place-items-center rounded-[15px] max-[481px]:rounded-[13px] [@media(min-width:351px)_and_(max-width:480px)]:w-[41px] [@media(min-width:351px)_and_(max-width:480px)]:h-[41px] max-[351px]:w-[35px] max-[351px]:h-[35px]';

export function AssetRow({ asset, onDelete, onEdit }: { asset: Asset; onDelete: (id: string) => void; onEdit: (id: string, quantity: number, unitPrice: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuantity, setDraftQuantity] = useState(String(asset.quantity));
  const [draftUnitPrice, setDraftUnitPrice] = useState(String(asset.unitPrice));
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraftQuantity(String(asset.quantity));
    setDraftUnitPrice(String(asset.unitPrice));
    setError(null);
    setIsEditing(true);
  };

  const save = () => {
    const quantity = Number(draftQuantity);
    const unitPrice = Number(draftUnitPrice);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      setError('عدد نامعتبر است.');
      return;
    }
    onEdit(asset.id, quantity, unitPrice);
    setIsEditing(false);
  };

  return <li className="bg-white border border-[#eef0f7] rounded-[17px] flex items-center gap-[15px] py-[17px] px-[22px] min-w-0 shadow-[0_4px_14px_#28377c03] max-[481px]:rounded-[15px] min-[1050px]:gap-[11px] min-[1050px]:p-[14px] [@media(min-width:351px)_and_(max-width:480px)]:gap-[12px] [@media(min-width:351px)_and_(max-width:480px)]:py-[15px] [@media(min-width:351px)_and_(max-width:480px)]:px-[14px] max-[351px]:gap-[9px] max-[351px]:py-[13px] max-[351px]:px-[10px]">
    <span className={`${assetIconBase} ${iconTint[asset.icon]}`} aria-hidden="true"><AssetIcon type={asset.icon}/></span>
    <div className="flex-1 min-w-0">
      <h3 className="text-[14px] font-medium [overflow-wrap:anywhere] max-[481px]:text-[12px]">{asset.name}</h3>
      {isEditing ? <div className="flex flex-wrap items-center gap-[6px] mt-[6px]">
        <input type="number" step="any" value={draftQuantity} onChange={e => setDraftQuantity(e.target.value)} className="w-[90px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`مقدار ${asset.name}`} />
        <span className="text-[11px] text-[#999fb2]">{asset.unit}</span>
        <input type="number" step="any" value={draftUnitPrice} onChange={e => setDraftUnitPrice(e.target.value)} className="w-[110px] text-[11px] border border-[#eef0f7] rounded-[8px] px-2 py-1" aria-label={`قیمت واحد ${asset.name} به تومان`} />
        {error && <span className="text-[10px] text-[#d95050] w-full">{error}</span>}
      </div> : <p className="text-[11px] text-[#999fb2] mt-[5px]">{format(asset.quantity, 8)} {asset.unit}</p>}
    </div>
    <div className="text-left shrink-0 flex flex-col gap-[6px] items-end">
      {!isEditing && <div className="flex flex-col gap-[5px] items-end"><strong className="text-[16px] font-bold [font-variant-numeric:tabular-nums] min-[1050px]:text-[14px] [@media(min-width:351px)_and_(max-width:480px)]:text-[14px] max-[351px]:text-[12px]">{format(asset.quantity * asset.unitPrice)}</strong><span className="text-[#a2a8b9] text-[10px]">تومان</span></div>}
      <div className="flex gap-[8px]">
        {isEditing ? <>
          <button type="button" onClick={save} className="text-[10px] font-medium text-white bg-[#5264e8] rounded-[8px] px-2 py-1">ذخیره</button>
          <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] text-[#9096aa] border border-[#eef0f7] rounded-[8px] px-2 py-1">انصراف</button>
        </> : <>
          <IconButton icon={<PencilIcon/>} onClick={startEdit} ariaLabel="ویرایش" tone="neutral" variant="ghost"/>
          <IconButton icon={<TrashIcon/>} onClick={() => onDelete(asset.id)} ariaLabel="حذف" tone="danger" variant="ghost"/>
        </>}
      </div>
    </div>
  </li>;
}

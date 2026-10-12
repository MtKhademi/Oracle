// `code` is the asset's catalog symbol (assigned by the server-driven catalog,
// see src/services/assetCatalog.ts); optional at the type level only so
// legacy locally-stored assets without a code still typecheck.
export type Asset = { id: string; name: string; quantity: number; unit: string; unitPrice: number; icon: 'gold' | 'fund' | 'cash' | 'usdt' | 'btc' | 'eth' | 'other'; code?: string };


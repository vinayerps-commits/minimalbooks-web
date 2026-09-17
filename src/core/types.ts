/**
 * MinimalBooks
 * core/types.ts
 *
 * Shared domain types for the framework phase (company, chart of accounts,
 * parties, items). Voucher/journal/stock types are added in core/voucher.ts
 * once Phase 1 (Invoice) starts.
 */

export interface Company {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  msme: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
}

export type AccountType = "asset" | "liability" | "income" | "expense" | "equity";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isGroup: boolean;
}

export type PartyType = "customer" | "vendor" | "both";
export type GstRegistrationType = "registered" | "unregistered" | "composition" | "overseas" | "consumer";

export interface Party {
  id: string;
  name: string;
  partyType: PartyType;
  billingAddress: string;
  shippingAddress: string;
  state: string;
  stateCode: string;
  gstin: string;
  gstRegistrationType: GstRegistrationType;
  phone: string;
  email: string;
  isActive: boolean;
}

export type ItemType = "raw_material" | "goods" | "service";

export interface Item {
  id: string;
  code: string;
  name: string;
  hsnSac: string;
  unit: string;
  saleRate: number;
  purchaseRate: number;
  taxPercent: number;
  itemType: ItemType;
  openingStock: number;
  isActive: boolean;
}

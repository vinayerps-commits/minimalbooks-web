/**
 * MinimalBooks
 * ui/nav.ts
 *
 * Declarative registry: nav tab -> sidebar groups -> screen component.
 * Adding a screen later is "write the component, add one entry here" --
 * Shell.tsx never changes. TS port of the same pattern in Mbooks'
 * C:\Users\padek\Mbooks\app\ui\nav_config.py (NavTab/NavGroup/BookEntry),
 * kept intact because it already maps out the product's full intended
 * surface (Sales/Purchase/Inventory/Registers/Reports/GST/Settings) --
 * screens not yet built in a given phase point at Placeholder rather than
 * being omitted, so the nav shape doesn't change shape phase to phase.
 */

import type { ComponentType } from "preact";
import { Placeholder } from "./widgets/Placeholder";
import { PartiesPage } from "./masters/PartiesPage";
import { ItemsPage } from "./masters/ItemsPage";
import { CompanySettingsPage } from "./masters/CompanySettingsPage";

export interface BookEntry {
  key: string;
  label: string;
  component: ComponentType;
}

export interface NavGroup {
  heading: string;
  entries: BookEntry[];
}

export interface NavTab {
  key: string;
  label: string;
  groups: NavGroup[];
}

function placeholder(title: string, key: string): BookEntry {
  return { key, label: title, component: () => Placeholder({ title }) };
}

export const NAV_TABS: NavTab[] = [
  {
    key: "books",
    label: "Books",
    groups: [
      {
        heading: "Sales",
        entries: [
          placeholder("Invoice Book", "invoice"),
          placeholder("Delivery Challan Book", "delivery_challan"),
          placeholder("Credit Note Book", "credit_note"),
          placeholder("Receipt Book", "receipt"),
          placeholder("Sales Order Book", "sales_order"),
        ],
      },
      {
        heading: "Purchase",
        entries: [
          placeholder("Purchase Bill Book", "purchase_bill"),
          placeholder("Purchase Order Book", "purchase_order"),
          placeholder("Debit Note Book", "debit_note"),
          placeholder("Payment Book", "payment"),
        ],
      },
      {
        heading: "Inventory",
        entries: [placeholder("Stock Adjustment Book", "stock_adjustment")],
      },
      {
        heading: "Other",
        entries: [placeholder("Journal Book", "journal"), placeholder("Expense Book", "expense")],
      },
    ],
  },
  {
    key: "masters",
    label: "Masters",
    groups: [
      {
        heading: "Masters",
        entries: [
          { key: "items_master", label: "Items", component: ItemsPage },
          { key: "parties_master", label: "Customers / Vendors", component: PartiesPage },
        ],
      },
    ],
  },
  {
    key: "registers",
    label: "Registers",
    groups: [
      {
        heading: "Registers",
        entries: [
          placeholder("Invoice Register", "invoice_register"),
          placeholder("Purchase Register", "purchase_register"),
          placeholder("Payment Register", "payment_register"),
        ],
      },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    groups: [
      {
        heading: "Reports",
        entries: [
          placeholder("Party Ledger", "ledger_report"),
          placeholder("Stock Summary", "stock_report"),
          placeholder("Profit & Loss", "pl_report"),
          placeholder("Balance Sheet", "bs_report"),
        ],
      },
    ],
  },
  {
    key: "gst",
    label: "GST",
    groups: [
      {
        heading: "GST",
        entries: [
          placeholder("GSTR-1 Summary", "gstr1"),
          placeholder("GSTR-3B Summary", "gstr3b"),
          placeholder("HSN Summary", "hsn_summary"),
        ],
      },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    groups: [
      {
        heading: "Settings",
        entries: [
          { key: "company_settings", label: "Company Settings", component: CompanySettingsPage },
          placeholder("Numbering Series", "numbering_settings"),
        ],
      },
    ],
  },
];

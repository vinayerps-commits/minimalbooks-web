-- MinimalBooks
-- supabase/migrations/0012_voucher_lines_part_no.sql
--
-- Adds part_no to voucher_lines, auto-filled from the selected item's code
-- at entry time and editable, same as description/hsn_sac already are --
-- freezes the part number as it was at invoice time (Tally-style: invoice
-- lines don't silently change if the item master's code changes later).

alter table public.voucher_lines add column part_no text not null default '';

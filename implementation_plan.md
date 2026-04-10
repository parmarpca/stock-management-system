# Implement Unified Order and Quotation Enhancements

This plan outlines the required steps to align the Order functionality with the Quotation functionality and implement requested database and UI enhancements.

## User Review Required

> [!WARNING]
> This plan requires structural database changes (SQL migrations) to support the new fields (Mobile Number, Vehicle Number, Agent Name, and pricing logic for Orders).
> **Please verify if my understanding of "Order will be same as Quotation" is completely correct.** Does it mean Orders should also be capable of calculating Subtotals, applying GST, tracking Additional Costs (just like Quotations), or do you primarily just want the UI layout and printing format to match with blank rate cells if skipped?

## Proposed Changes

### 1. Database Schema Updates
To support the additional fields and unify Orders and Quotations, the following SQL changes will be needed (I will generate that script for you to run once approved):
- `customers` table check/update:
  - Add `mobile_number` field.
- `orders` table updates:
  - Add `vehicle_number`, `agent_name`.
  - Add pricing fields (matching quotations): `subtotal`, `gst_enabled`, `gst_percentage`, `gst_amount`, `total_amount`, etc.
- `order_items` table updates:
  - Add `price_per_piece`, `weight`, and `subtotal`.
- We may also need to replicate the additional costs table for orders (e.g., `order_additional_costs`) if you want exactly identical features, or I can bypass additional costs for orders if they are not necessary there.

### 2. TypeScript Types (`src/integrations/supabase/types.ts`)
- [MODIFY] `types.ts`
  - Enhance `customers`, `orders`, and `order_items` row and insert definitions to map to the new database schema.

### 3. Customer Data Management
- [MODIFY] `src/hooks/useStockData.ts` & `src/hooks/useQuotationData.ts`
  - Include the `mobile_number` parameter in Customer creation/updating functions and the local component lists.

### 4. Order Management Updates
- [MODIFY] `src/components/OrderManager.tsx`
  - Overhaul the Create/Edit dialog to practically mirror `src/components/QuotationManager.tsx`.
  - Include validation where you check `pieces_used` against the current `selectedStock.quantity`.
  - Add "Weight" editing field dynamically.
  - Add inputs for "Vehicle Number" and "Agent Name".
  - Update the "Print Order" UI template to EXACTLY reflect the provided receipt design, ensuring the new `Mobile Number`, `Vehicle No. (V.NO)`, and `Agent Name` placeholders exist, along with the specified columns and rate calculations.

### 5. Quotation Management Updates
- [MODIFY] `src/components/QuotationManager.tsx`
  - The feature states: "do not show any quotation directly on Dashboard, replace today's quotation button to show quotations list".
  - Currently, when navigating to the Quotations tab, the list is displayed immediately. I will change the logic to hide the table of quotations by default.
  - Instead of "Filter Today's Quotation", there will be a "Show Quotations List" button. The list will only display after clicking this button.

## Open Questions
> [!IMPORTANT]
> 1. In `orders` table updates, do you also want an `order_additional_costs` table to be created in your database fully mirroring quotations, or is the base item calculation (Items + GST) sufficient for Orders?
> 2. The print image shows "RATE" and "AMOUNT". Is rate entry mandatory for creating an Order, or can an Order be created with a rate of `0` in some cases without erroring?
> 3. Does the Database Migration need to be given as a Supabase SQL query snippet you can drop into your Supabase Dashboard?

## Verification Plan
### Automated Tests
- TypeScript checking via `npm run typecheck` or similar to guarantee `types.ts` schema overrides line up everywhere.

### Manual Verification
- Walk through creating a new Customer; confirm Mobile Number holds state.
- Create an Order using the new form; exceed available quantity to verify stock validation logic still prevents creation.
- Check the generated Order Print preview to ensure the invoice/table matches the user-provided screenshot.
- Visit Quotation component and verify no quotations are automatically loaded unless "Show Quotations" is triggered.

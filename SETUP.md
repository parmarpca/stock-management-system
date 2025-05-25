# Stock Flow Factory Management - Setup Guide

## Database Setup

### 1. Create Supabase Tables

Run the following SQL queries in your Supabase SQL editor:

```sql
-- First, run the table creation script
-- Execute: supabase/queries/01_create_tables.sql

-- Then, run the seed data script
-- Execute: supabase/queries/02_seed_data.sql

-- Finally, add stock history tracking
-- Execute: supabase/queries/03_add_stock_history.sql
```

### 2. Project Structure

The project has been restructured to support multiple items per order:

#### Database Schema:

- **customers**: Store customer information
- **stocks**: Store stock items with quantities
- **orders**: Store order headers with customer and date info
- **order_items**: Store individual items within each order (many-to-many relationship)
- **stock_history**: Track all stock movements (add/sell/adjust) with automatic logging

#### Key Features:

- ✅ Multiple items per order
- ✅ Real-time stock quantity updates
- ✅ Customer management with smart suggestions
- ✅ Order history and tracking
- ✅ Print functionality for orders
- ✅ Add stock functionality with duplicate code handling
- ✅ Stock history tracking with automatic logging
- ✅ Prevent duplicate items in single order
- ✅ Real-time quantity validation
- ✅ Loading states and error handling

#### Components Updated:

- `useStockData.ts`: Updated to work with Supabase and new schema
- `OrderManager.tsx`: New component supporting multiple items per order
- `OrderManagement.tsx`: Updated to use new OrderManager
- `Dashboard.tsx`: Updated to show order data instead of slips
- `types.ts`: Updated with proper Supabase type definitions

### 3. Environment Setup

Make sure your `.env.local` file contains:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Running the Project

```bash
npm install
npm run dev
```

### 5. Key Changes Made

1. **Database Structure**: Moved from single-item slips to multi-item orders
2. **Order Creation**: Now supports adding multiple stock items to a single order
3. **Customer Management**: Added ability to create new customers during order creation
4. **Stock Updates**: Automatic stock quantity reduction when orders are created
5. **Type Safety**: Full TypeScript support with proper Supabase types

### 6. Usage

1. **Creating Orders**:

   - Type customer name with smart suggestions (creates new customer if not found)
   - Add multiple items by searching stock and specifying quantities
   - Prevents adding duplicate items to same order
   - Real-time quantity validation with error messages
   - Loading states during order creation
   - Review items before creating order

2. **Stock Management**:

   - Add new stock items or update existing ones (quantities are added if same code exists)
   - Stock quantities automatically update when orders are created
   - Low stock alerts on dashboard
   - Click on any stock item to view complete history

3. **Stock History Tracking**:

   - Automatic logging of all stock movements (ADD/SELL/ADJUST)
   - View detailed history for each stock item
   - Track quantity changes with before/after values
   - Timestamps and notes for each transaction

4. **Order History**:
   - View all orders with customer and item details
   - Print individual orders
   - Filter by customer and date range

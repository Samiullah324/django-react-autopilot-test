import type { ActivityItem, DashboardStats } from '../types';

export const landingStats: DashboardStats = {
  total_products: 5,
  low_stock_items: 1,
  out_of_stock_items: 0,
  total_suppliers: 2,
  recent_transactions: 12,
};

export interface LandingFeature {
  title: string;
  description: string;
}

export const landingFeatures: LandingFeature[] = [
  {
    title: 'Real-time Inventory',
    description: 'Track stock levels across warehouses with live updates and low-stock alerts.',
  },
  {
    title: 'Supplier Management',
    description: 'Manage vendor relationships, contacts, and product catalogs in one place.',
  },
  {
    title: 'Transaction History',
    description: 'Audit purchases, sales, and adjustments with a full activity timeline.',
  },
  {
    title: 'Role-based Access',
    description: 'Admin, manager, and staff roles keep operations secure and organized.',
  },
];

export const landingCategoryHighlights = [
  { name: 'Electronics', count: 3 },
  { name: 'Office Supplies', count: 1 },
  { name: 'Furniture', count: 1 },
];

export const landingRecentActivity: ActivityItem[] = [
  {
    id: 1,
    transaction_type: 'purchase',
    transaction_type_display: 'Purchase',
    product_name: 'Wireless Mouse',
    warehouse_name: 'Main Warehouse',
    quantity: 50,
    created_by_name: 'Admin User',
    created_at: '2026-05-24T09:15:00Z',
  },
  {
    id: 2,
    transaction_type: 'purchase',
    transaction_type_display: 'Purchase',
    product_name: 'USB-C Hub',
    warehouse_name: 'Main Warehouse',
    quantity: 30,
    created_by_name: 'Jane Manager',
    created_at: '2026-05-23T14:30:00Z',
  },
  {
    id: 3,
    transaction_type: 'adjustment',
    transaction_type_display: 'Adjustment',
    product_name: 'Mechanical Keyboard',
    warehouse_name: 'Secondary Storage',
    quantity: -2,
    created_by_name: 'Staff Member',
    created_at: '2026-05-22T11:05:00Z',
  },
  {
    id: 4,
    transaction_type: 'purchase',
    transaction_type_display: 'Purchase',
    product_name: 'Office Chair',
    warehouse_name: 'Main Warehouse',
    quantity: 8,
    created_by_name: 'Admin User',
    created_at: '2026-05-21T16:45:00Z',
  },
];

export const landingWarehouses = [
  { name: 'Main Warehouse', location: 'Building A, Floor 1', products: 4 },
  { name: 'Secondary Storage', location: 'Building B', products: 3 },
];

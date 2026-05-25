import type { ActivityItem, DashboardStats } from '../types';

export const landingStats: DashboardStats = {
  total_products: 248,
  low_stock_items: 12,
  out_of_stock_items: 3,
  total_suppliers: 18,
  recent_transactions: 156,
};

export const landingFeatures = [
  {
    title: 'Real-time inventory',
    description: 'Track stock levels across warehouses with instant updates on every movement.',
  },
  {
    title: 'Supplier management',
    description: 'Keep vendor contacts, purchase history, and lead times in one place.',
  },
  {
    title: 'Smart alerts',
    description: 'Get notified when items run low, go out of stock, or approach expiry dates.',
  },
  {
    title: 'Reports & exports',
    description: 'Generate transaction reports and export product catalogs to CSV or Excel.',
  },
];

export const landingCategoryDistribution = [
  { name: 'Electronics', count: 68 },
  { name: 'Office Supplies', count: 52 },
  { name: 'Furniture', count: 41 },
  { name: 'Packaging', count: 47 },
  { name: 'Other', count: 40 },
];

export const landingTransactionTrends = [
  { day: '2026-05-19', count: 18 },
  { day: '2026-05-20', count: 24 },
  { day: '2026-05-21', count: 21 },
  { day: '2026-05-22', count: 29 },
  { day: '2026-05-23', count: 26 },
  { day: '2026-05-24', count: 22 },
  { day: '2026-05-25', count: 16 },
];

export const landingRecentActivity: ActivityItem[] = [
  {
    id: 1,
    transaction_type: 'stock_in',
    transaction_type_display: 'Stock In',
    product_name: 'Wireless Keyboard MK-200',
    warehouse_name: 'Central Warehouse',
    quantity: 50,
    created_by_name: 'Alex Morgan',
    created_at: '2026-05-25T09:14:00Z',
  },
  {
    id: 2,
    transaction_type: 'stock_out',
    transaction_type_display: 'Stock Out',
    product_name: 'USB-C Dock Pro',
    warehouse_name: 'East Distribution',
    quantity: -12,
    created_by_name: 'Jordan Lee',
    created_at: '2026-05-25T08:42:00Z',
  },
  {
    id: 3,
    transaction_type: 'adjustment',
    transaction_type_display: 'Adjustment',
    product_name: 'Ergonomic Office Chair',
    warehouse_name: 'Central Warehouse',
    quantity: -2,
    created_by_name: 'Sam Patel',
    created_at: '2026-05-24T16:30:00Z',
  },
  {
    id: 4,
    transaction_type: 'stock_in',
    transaction_type_display: 'Stock In',
    product_name: 'Thermal Label Rolls (500)',
    warehouse_name: 'West Fulfillment',
    quantity: 120,
    created_by_name: 'Alex Morgan',
    created_at: '2026-05-24T11:05:00Z',
  },
];

export const landingLowStockItems = [
  { sku: 'SKU-1042', name: '27" Monitor Stand', warehouse: 'East Distribution', quantity: 4, threshold: 10 },
  { sku: 'SKU-0891', name: 'Bluetooth Mouse M3', warehouse: 'Central Warehouse', quantity: 7, threshold: 15 },
  { sku: 'SKU-1205', name: 'HDMI Cable 2m', warehouse: 'West Fulfillment', quantity: 9, threshold: 20 },
];

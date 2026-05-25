export interface LandingStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalSuppliers: number;
  recentTransactions: number;
}

export interface FeaturedProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface RecentActivity {
  id: number;
  type: string;
  productName: string;
  warehouse: string;
  quantity: number;
  user: string;
  timestamp: string;
}

export interface CategorySummary {
  name: string;
  count: number;
}

export const landingStats: LandingStats = {
  totalProducts: 128,
  lowStockItems: 12,
  outOfStockItems: 3,
  totalSuppliers: 24,
  recentTransactions: 1567,
};

export const featuredProducts: FeaturedProduct[] = [
  {
    id: 1,
    name: 'Wireless Mouse',
    sku: 'WM-001',
    category: 'Electronics',
    price: 29.99,
    quantity: 142,
    stockStatus: 'in_stock',
  },
  {
    id: 2,
    name: 'USB-C Hub',
    sku: 'UCH-002',
    category: 'Electronics',
    price: 49.99,
    quantity: 18,
    stockStatus: 'low_stock',
  },
  {
    id: 3,
    name: 'Mechanical Keyboard',
    sku: 'MK-003',
    category: 'Electronics',
    price: 129.99,
    quantity: 0,
    stockStatus: 'out_of_stock',
  },
  {
    id: 4,
    name: 'Notebook A5',
    sku: 'NB-004',
    category: 'Office Supplies',
    price: 4.99,
    quantity: 520,
    stockStatus: 'in_stock',
  },
  {
    id: 5,
    name: 'Office Chair',
    sku: 'OC-005',
    category: 'Furniture',
    price: 299.99,
    quantity: 8,
    stockStatus: 'low_stock',
  },
];

export const recentActivity: RecentActivity[] = [
  {
    id: 1,
    type: 'Stock In',
    productName: 'Wireless Mouse',
    warehouse: 'Main Warehouse',
    quantity: 50,
    user: 'Jane Manager',
    timestamp: '2026-05-25T09:14:00Z',
  },
  {
    id: 2,
    type: 'Stock Out',
    productName: 'USB-C Hub',
    warehouse: 'Main Warehouse',
    quantity: 12,
    user: 'Alex Staff',
    timestamp: '2026-05-25T08:42:00Z',
  },
  {
    id: 3,
    type: 'Adjustment',
    productName: 'Notebook A5',
    warehouse: 'Secondary Storage',
    quantity: -5,
    user: 'Jane Manager',
    timestamp: '2026-05-24T16:30:00Z',
  },
  {
    id: 4,
    type: 'Stock In',
    productName: 'Office Chair',
    warehouse: 'Secondary Storage',
    quantity: 10,
    user: 'Admin User',
    timestamp: '2026-05-24T11:05:00Z',
  },
];

export const categorySummary: CategorySummary[] = [
  { name: 'Electronics', count: 48 },
  { name: 'Office Supplies', count: 52 },
  { name: 'Furniture', count: 18 },
  { name: 'Uncategorized', count: 10 },
];

export const landingHighlights = [
  'Real-time stock tracking across multiple warehouses',
  'Low-stock alerts and automated notifications',
  'Supplier management with purchase history',
  'CSV/Excel import, export, and PDF reports',
];

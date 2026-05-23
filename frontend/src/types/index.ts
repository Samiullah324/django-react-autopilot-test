export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  role: UserRole;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: UserProfile;
  is_active: boolean;
  date_joined: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  product_count: number;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  product_count: number;
  total_inventory_value: number;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  location: string;
  is_active: boolean;
  total_items: number;
  created_at: string;
}

export interface StockLevel {
  id: number;
  warehouse: number;
  warehouse_name: string;
  warehouse_code: string;
  quantity: number;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: number | null;
  category_name: string;
  supplier: number | null;
  supplier_name: string;
  price: string;
  low_stock_threshold: number;
  description: string;
  image: string | null;
  expiry_date: string | null;
  is_active: boolean;
  total_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_levels: StockLevel[];
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number;
  warehouse_name: string;
  transaction_type: string;
  quantity: number;
  unit_price: string | null;
  reference: string;
  notes: string;
  performed_by: number | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  product: number | null;
  product_name: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_suppliers: number;
  unread_notifications: number;
  recent_transactions: InventoryTransaction[];
  daily_activity: { day: string; count: number }[];
  category_breakdown: { name: string; product_count: number }[];
  transaction_by_type: { transaction_type: string; count: number }[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
  phone: string;
}

export interface DashboardStats {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_suppliers: number;
  recent_transactions: number;
}

export interface DashboardData {
  stats: DashboardStats;
  category_distribution: { name: string; count: number }[];
  transaction_trends: { day: string; transaction_type: string; total: number }[];
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  transaction_type: string;
  transaction_type_display: string;
  product_name: string;
  warehouse_name: string;
  quantity: number;
  created_by_name: string;
  created_at: string;
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
  total_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  image_url: string | null;
  expiry_date: string | null;
  is_active: boolean;
  description?: string;
  stock_levels?: WarehouseStock[];
}

export interface WarehouseStock {
  id: number;
  warehouse: number;
  warehouse_name: string;
  quantity: number;
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
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Transaction {
  id: number;
  transaction_type: string;
  transaction_type_display: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_number: string;
  notes: string;
  created_by_name: string;
  created_at: string;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  product_name: string;
  is_read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

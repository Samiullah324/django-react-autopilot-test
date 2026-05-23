import type { Product } from '../types';

export function StockBadge({ status }: { status: Product['stock_status'] }) {
  if (status === 'in_stock') return <span className="badge badge-success">In Stock</span>;
  if (status === 'low_stock') return <span className="badge badge-warning">Low Stock</span>;
  return <span className="badge badge-danger">Out of Stock</span>;
}

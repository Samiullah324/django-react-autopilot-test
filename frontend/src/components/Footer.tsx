export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span className="app-footer-brand">StockFlow</span>
      <span className="app-footer-text">Inventory Management</span>
      <span className="app-footer-copy">&copy; {year} StockFlow. All rights reserved.</span>
    </footer>
  );
}

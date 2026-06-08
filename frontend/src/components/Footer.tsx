export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-start">
        <span className="app-footer-brand">StockFlow</span>
        <span className="app-footer-text">Inventory Management</span>
      </div>
      <div className="app-footer-end">
        <span className="app-footer-copy">&copy; {year} StockFlow. All rights reserved.</span>
      </div>
    </footer>
  );
}

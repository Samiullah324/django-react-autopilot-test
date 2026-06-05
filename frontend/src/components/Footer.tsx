export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span>StockFlow · Inventory Management</span>
      <span>© {year}</span>
    </footer>
  );
}

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const toneStyles = {
  primary: { bg: 'var(--primary-soft)', color: 'var(--primary)' },
  success: { bg: 'var(--success-soft)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-soft)', color: 'var(--warning)' },
  danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
};

export function StatCard({ label, value, icon: Icon, tone = 'primary' }: StatCardProps) {
  const style = toneStyles[tone];
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: style.bg, color: style.color }}>
        <Icon size={20} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

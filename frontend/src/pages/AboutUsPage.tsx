import { Heart, Shield, Target, Users, Zap } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'We help businesses maintain optimal stock levels with clarity and confidence.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: 'Accurate inventory data and dependable workflows you can trust every day.',
  },
  {
    icon: Zap,
    title: 'Efficiency',
    description: 'Streamlined tools that reduce manual work and keep teams focused on growth.',
  },
  {
    icon: Heart,
    title: 'Customer Focus',
    description: 'Every feature is designed around the real needs of warehouse and ops teams.',
  },
];

const team = [
  { name: 'Alex Rivera', role: 'Product Lead' },
  { name: 'Jordan Lee', role: 'Engineering' },
  { name: 'Sam Patel', role: 'Customer Success' },
  { name: 'Taylor Morgan', role: 'Operations' },
];

export function AboutUsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h2>About Us</h2>
          <p>Learn more about StockFlow and the team behind your inventory platform</p>
        </div>
      </div>

      <div className="card card--spaced" style={{ marginTop: 0 }}>
        <div className="card-header">Our Story</div>
        <div className="card-body">
          <p style={{ margin: '0 0 16px' }}>
            StockFlow is an inventory management platform built for modern businesses that need
            real-time visibility across products, warehouses, and suppliers. We started with a
            simple goal: make stock control intuitive, accurate, and accessible for teams of every size.
          </p>
          <p style={{ margin: 0 }}>
            From small retail operations to multi-warehouse distribution networks, StockFlow
            provides the tools to track inventory, manage transactions, and stay ahead of low-stock
            alerts — all in one unified dashboard.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">Our Mission</div>
          <div className="card-body">
            <p style={{ margin: 0 }}>
              To empower organizations with transparent, actionable inventory insights that
              eliminate guesswork and drive smarter operational decisions.
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">Our Vision</div>
          <div className="card-body">
            <p style={{ margin: 0 }}>
              A world where every business — regardless of scale — has enterprise-grade inventory
              intelligence at their fingertips, enabling sustainable growth and customer satisfaction.
            </p>
          </div>
        </div>
      </div>

      <div className="card card--spaced">
        <div className="card-header">Our Values</div>
        <div className="card-body">
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="stat-card">
                <div className="stat-card-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <Icon size={20} />
                </div>
                <div className="stat-card-label">{title}</div>
                <p className="text-sm text-muted" style={{ margin: 0 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card card--spaced">
        <div className="card-header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} /> Our Team
          </span>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member.name}>
                    <td>{member.name}</td>
                    <td className="text-muted">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

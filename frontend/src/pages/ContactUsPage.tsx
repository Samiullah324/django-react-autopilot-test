import { Clock, Mail, MapPin, Phone } from 'lucide-react';

const contactDetails = [
  { icon: Mail, label: 'Email', value: 'support@stockflow.example.com' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
  { icon: MapPin, label: 'Address', value: '123 Warehouse Blvd, Suite 400, San Francisco, CA 94107' },
  { icon: Clock, label: 'Business Hours', value: 'Monday – Friday, 9:00 AM – 6:00 PM PST' },
];

export function ContactUsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h2>Contact Us</h2>
          <p>We&apos;re here to help — reach out with questions, feedback, or support requests</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">Get in Touch</div>
          <div className="card-body">
            <p style={{ margin: '0 0 20px' }}>
              Whether you need help setting up your inventory, have a feature request, or want to
              learn more about StockFlow, our team is ready to assist. Send us a message and we&apos;ll
              respond within one business day.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {contactDetails.map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    className="stat-card-icon"
                    style={{
                      background: 'var(--primary-soft)',
                      color: 'var(--primary)',
                      marginBottom: 0,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 500 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Send a Message</div>
          <div className="card-body">
            <form
              onSubmit={(e) => e.preventDefault()}
              aria-label="Contact form (demo only)"
            >
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="contact-name">Full Name</label>
                  <input id="contact-name" type="text" placeholder="Jane Doe" />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email Address</label>
                  <input id="contact-email" type="email" placeholder="jane@company.com" />
                </div>
                <div className="form-group form-group--full">
                  <label htmlFor="contact-subject">Subject</label>
                  <input id="contact-subject" type="text" placeholder="How can we help?" />
                </div>
                <div className="form-group form-group--full">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us more about your inquiry..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
                <Mail size={16} /> Send Message
              </button>
              <p className="text-sm text-muted" style={{ marginTop: 12, marginBottom: 0 }}>
                This form is for demonstration purposes only and does not submit data.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

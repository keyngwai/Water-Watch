import Layout from '../../components/shared/Layout';

const CitizenFAQ = () => {
  const faqData = [
    {
      title: "Quick Start Guide",
      items: [
        {
          q: "👤 1. Register & Profile",
          a: "Create your account using your email and phone number. Select your county to see relevant local reports and infrastructure updates."
        },
        {
          q: "📝 2. Reporting an Issue",
          a: "Click 'Report Issue'. Select a category (e.g., Pipe Burst), describe the problem, and use the map to pin the exact location."
        },
        {
          q: "📸 3. Adding Evidence",
          a: "Upload up to 3 clear photos. Our system automatically strips location metadata from your photos for your privacy and security."
        },
        {
          q: "🔔 4. Track & Upvote",
          a: "Check 'My Reports' for live status updates. You can also upvote other reports in your area to help the county prioritize repairs."
        }
      ]
    },
    {
      title: "Core Questions",
      items: [
        {
          q: "How do I submit a report?",
          a: "Use the 'Report Issue' button. You'll follow a 4-step process: Category -> Description & Photos -> Pin Location on Map -> Review & Submit."
        },
        {
          q: "What do the statuses mean?",
          a: "🟡 Reported: Waiting for review. 🔵 Verified: Admin confirmed the issue. 🟣 In Progress: Technician assigned. 🟢 Resolved: The issue is fixed!"
        }
      ]
    },
    {
      title: "Community & Privacy",
      items: [
        {
          q: "What is upvoting?",
          a: "If you see an existing report for a problem you're also facing, upvote it! This signals high community priority to the county admins."
        },
        {
          q: "Is my data safe?",
          a: "Yes. Your personal contact info is hidden from the public. We also automatically strip GPS metadata from your photos for privacy."
        }
      ]
    }
  ];

  return (
    <Layout title="Citizen Support Center">
      <div style={styles.container}>
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>Maji Watch Support</h2>
          <p style={styles.heroText}>
            Need help reporting a leak or tracking a fix? We've got you covered.
          </p>
        </div>

        <div style={styles.grid}>
          {faqData.map((section, sIdx) => (
            <div key={sIdx} style={styles.section}>
              <h3 style={styles.sectionTitle}>{section.title}</h3>
              <div style={styles.faqList}>
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} style={styles.faqItem}>
                    <h4 style={styles.question}>{item.q}</h4>
                    <p style={styles.answer}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>Maji Watch v1.0 | Systems Project 2026</p>
        </div>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  hero: {
    padding: '40px 30px',
    background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    borderRadius: '16px',
    color: 'white',
    marginBottom: '32px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(3, 105, 161, 0.2)',
  },
  heroTitle: { fontSize: '28px', fontWeight: 800, margin: '0 0 10px' },
  heroText: { fontSize: '16px', opacity: 0.9, margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
  section: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sectionTitle: { 
    fontSize: '18px', 
    fontWeight: 700, 
    color: '#0369a1', 
    borderBottom: '2px solid #e0f2fe',
    paddingBottom: '8px',
    margin: '0 0 8px'
  },
  faqList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  faqItem: {
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  question: { margin: '0 0 8px', color: '#1e293b', fontSize: '15px', fontWeight: 600 },
  answer: { margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' },
  footer: { marginTop: '48px', textAlign: 'center', padding: '24px 0', borderTop: '1px solid #e2e8f0' },
  footerText: { fontSize: '12px', color: '#94a3b8' },
};

export default CitizenFAQ;
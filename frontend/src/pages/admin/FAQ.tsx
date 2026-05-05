import Layout from '../../components/shared/Layout';

const AdminFAQ = () => {
  const managementWorkflow = [
    {
      title: "Operational Workflow",
      steps: [
        { icon: "🔍", label: "Verify", detail: "Review citizen reports for validity and accuracy." },
        { icon: "🛠️", label: "Assign", detail: "Route verified tasks to available field technicians." },
        { icon: "📈", label: "Monitor", detail: "Track resolution times and infrastructure hotspots." },
        { icon: "✅", label: "Resolve", detail: "Confirm repairs and close the feedback loop with citizens." }
      ]
    }
  ];

  const adminGuides = [
    {
      title: "Core Workflow",
      items: [
        {
          q: "How do I verify a report?",
          a: "Review the description and photos. If legitimate, click 'Verify' in the action panel. This notifies the citizen and prepares the report for technician assignment."
        },
        {
          q: "How do I assign a technician?",
          a: "For verified reports, use the 'Assign Technician' button. Choose an available technician based on their specialization and current workload."
        },
        {
          q: "When should I mark a report as resolved?",
          a: "Once the field technician confirms the repair is complete, click 'Mark Resolved'. You can add a public comment to explain what was fixed."
        }
      ]
    },
    {
      title: "Data & Management",
      items: [
        {
          q: "How do I use the analytics?",
          a: "The dashboard provides real-time KPIs on report volumes, status distribution, and category rankings to help identify infrastructure hotspots."
        },
        {
          q: "Can I export data?",
          a: "Yes! Use the 'Export CSV' or 'Export PDF' buttons on the Reports page. These exports respect any active filters you have applied."
        },
        {
          q: "How do I add technicians?",
          a: "Go to the Technicians page and click 'Add Technician'. Fill in their professional details and a user account will be created automatically."
        }
      ]
    }
  ];

  return (
    <Layout title="Administrator Control Center">
      <div style={styles.container}>
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>Command & Control Guide</h2>
          <p style={styles.heroText}>
            Operational procedures for managing water infrastructure reports and field personnel.
          </p>
        </div>

        <div style={styles.workflowSection}>
          {managementWorkflow.map((flow, idx) => (
            <div key={idx} style={styles.workflowCard}>
              <h3 style={styles.workflowTitle}>{flow.title}</h3>
              <div style={styles.stepsGrid}>
                {flow.steps.map((step, sIdx) => (
                  <div key={sIdx} style={styles.stepItem}>
                    <div style={styles.stepIcon}>{step.icon}</div>
                    <div style={styles.stepLabel}>{step.label}</div>
                    <div style={styles.stepDetail}>{step.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.grid}>
          {adminGuides.map((section, sIdx) => (
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
          <p style={styles.footerText}>Maji Watch Admin Suite v1.0 | Systems Project 2026</p>
        </div>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto' },
  hero: {
    padding: '40px 30px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '16px',
    color: '#38bdf8',
    marginBottom: '32px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    border: '1px solid #334155',
  },
  heroTitle: { fontSize: '28px', fontWeight: 800, margin: '0 0 10px', color: '#f1f5f9' },
  heroText: { fontSize: '16px', opacity: 0.8, margin: 0, color: '#94a3b8' },
  workflowSection: { marginBottom: '48px' },
  workflowCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #334155',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
  },
  workflowTitle: { color: '#38bdf8', fontSize: '20px', fontWeight: 700, marginBottom: '24px', textAlign: 'center' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' },
  stepItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
  stepIcon: { fontSize: '32px', background: '#0f172a', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '1px solid #334155' },
  stepLabel: { color: '#f1f5f9', fontWeight: 700, fontSize: '16px' },
  stepDetail: { color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { 
    fontSize: '20px', 
    fontWeight: 700, 
    color: '#38bdf8', 
    borderBottom: '1px solid #334155',
    paddingBottom: '10px',
    margin: '0 0 4px',
    letterSpacing: '0.5px'
  },
  faqList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  faqItem: {
    padding: '20px',
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    transition: 'transform 0.2s ease',
  },
  question: { margin: '0 0 10px', color: '#f1f5f9', fontSize: '16px', fontWeight: 600 },
  answer: { margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' },
  footer: { marginTop: '64px', textAlign: 'center', padding: '32px 0', borderTop: '1px solid #334155' },
  footerText: { fontSize: '12px', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' },
};

export default AdminFAQ;
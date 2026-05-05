import Layout from '../../components/shared/Layout';

export default function TechnicianFAQ() {
  const operationsGuide = [
    {
      title: "Field Workflow",
      steps: [
        { label: "Step 1: Receive Assignment", detail: "Get real-time alerts on your dashboard for new tasks assigned to your county." },
        { label: "Step 2: Review Details", detail: "Check report description, photos, and use the interactive map for precise navigation." },
        { label: "Step 3: Field Action", detail: "Travel to site, perform repairs, and take notes of any additional infrastructure needs." },
        { label: "Step 4: Resolve Task", detail: "Click 'Mark Resolved' to update the system and notify the reporting citizen instantly." }
      ]
    }
  ];

  const faqData = [
    {
      question: "How do I see my new assignments?",
      answer: "New assignments will appear on your dashboard under 'My Tasks'. You will also receive a real-time notification (toast) at the top of your screen whenever an admin assigns a new task to you."
    },
    {
      question: "How do I navigate to a task location?",
      answer: "Each task on your dashboard includes the location name and county details. Click 'View Details' to see the full report, which includes an interactive map with a precise pin for the issue. You can use the map to guide your field navigation."
    },
    {
      question: "What should I do after completing a repair?",
      answer: "Once the repair is finished, click the 'Mark Resolved' button on the task card or within the report details. This will update the system, record your completion, and notify the citizen who reported the issue."
    },
    {
      question: "Can I re-open a resolved task?",
      answer: "Currently, only admins can re-open tasks. If you marked a task as resolved by mistake, please contact your county admin to have it re-assigned or updated."
    },
    {
      question: "How is my performance tracked?",
      answer: "The system tracks the time from assignment to resolution and the number of active tasks you are managing. Admins use these metrics to balance workloads and ensure timely infrastructure repairs."
    }
  ];

  return (
    <Layout title="Technician Field Guide">
      <div style={styles.container}>
        <div style={styles.intro}>
          <h2 style={styles.introTitle}>Field Operations Manual</h2>
          <p style={styles.introText}>
            Welcome to the Maji Watch Technician Portal. This guide explains how to manage your 
            field assignments and report resolutions effectively.
          </p>
        </div>

        <div style={styles.guideSection}>
          {operationsGuide.map((section, idx) => (
            <div key={idx} style={styles.guideCard}>
              <h3 style={styles.guideTitle}>{section.title}</h3>
              <div style={styles.stepsGrid}>
                {section.steps.map((step, sIdx) => (
                  <div key={sIdx} style={styles.stepItem}>
                    <div style={styles.stepLabel}>{step.label}</div>
                    <div style={styles.stepDetail}>{step.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h3 style={styles.faqHeader}>Frequently Asked Questions</h3>
        <div style={styles.faqList}>
          {faqData.map((item, index) => (
            <div key={index} style={styles.faqItem}>
              <h3 style={styles.question}>{item.question}</h3>
              <p style={styles.answer}>{item.answer}</p>
            </div>
          ))}
        </div>

        <div style={styles.supportBox}>
          <h3 style={styles.supportTitle}>Need Technical Support?</h3>
          <p style={styles.supportText}>
            If you encounter issues with the portal or mapping system while in the field, 
            please contact the County IT Support desk or your immediate supervisor.
          </p>
        </div>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  intro: {
    marginBottom: '32px',
    padding: '24px',
    background: '#064e3b',
    borderRadius: '12px',
    border: '1px solid #065f46',
  },
  introTitle: { margin: '0 0 8px', color: '#10b981', fontSize: '20px' },
  introText: { margin: 0, color: '#d1fae5', fontSize: '15px', lineHeight: '1.6' },
  guideSection: { marginBottom: '40px' },
  guideCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #334155',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  guideTitle: { color: '#38bdf8', fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' },
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  stepItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
  stepLabel: { color: '#10b981', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  stepDetail: { color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' },
  faqHeader: { color: '#e2e8f0', fontSize: '18px', marginBottom: '20px', paddingLeft: '4px' },
  faqList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  faqItem: {
    padding: '20px',
    background: '#1e293b',
    borderRadius: '10px',
    border: '1px solid #334155',
  },
  question: { margin: '0 0 10px', color: '#f1f5f9', fontSize: '16px', fontWeight: 600 },
  answer: { margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' },
  supportBox: {
    marginTop: '40px',
    padding: '24px',
    background: '#0f172a',
    borderRadius: '12px',
    border: '1px dashed #334155',
    textAlign: 'center',
  },
  supportTitle: { margin: '0 0 8px', color: '#e2e8f0', fontSize: '16px' },
  supportText: { margin: 0, color: '#64748b', fontSize: '14px' },
};

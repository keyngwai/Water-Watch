import Layout from '../../components/shared/Layout';

export default function TechnicianFAQ() {
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

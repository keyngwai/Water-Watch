import Layout from '../../components/shared/Layout';
import { useState } from 'react';

const SystemManual = () => {
  const [activeTab, setActiveTab] = useState('srs');

  const docs = {
    srs: {
      title: "Software Requirements Specification",
      sections: [
        {
          title: "Functional Requirements",
          items: [
            { id: "FR1", text: "User Authentication: Multi-role support (Citizen, Admin, Tech)" },
            { id: "FR2", text: "Citizen Reporting: GPS pinning and photo upload capabilities" },
            { id: "FR3", text: "Community Engagement: Real-time upvoting and public dashboard" },
            { id: "FR4", text: "Admin Workflow: Verification, assignment, and resolution logic" }
          ]
        },
        {
          title: "Non-Functional Requirements",
          items: [
            { id: "NFR1", text: "Security: JWT dual-token flow and Bcrypt hashing" },
            { id: "NFR2", text: "Performance: <300ms API response time" },
            { id: "NFR3", text: "Scalability: Stateless architecture for horizontal scaling" }
          ]
        }
      ]
    },
    sdd: {
      title: "Software Design Description",
      sections: [
        {
          title: "System Architecture",
          items: [
            { id: "ARCH1", text: "Frontend: React SPA with Vite & Tailwind-inspired styles" },
            { id: "ARCH2", text: "Backend: Node.js/Express REST API" },
            { id: "ARCH3", text: "Database: PostgreSQL with PostGIS for GIS operations" },
            { id: "ARCH4", text: "Real-time: Socket.io for cross-role notifications" }
          ]
        },
        {
          title: "Data Models",
          items: [
            { id: "DB1", text: "Users: Role-based identity management" },
            { id: "DB2", text: "Reports: Geo-spatial issue tracking" },
            { id: "DB3", text: "Technicians: Professional profiles and workload tracking" }
          ]
        }
      ]
    },
    prd: {
      title: "Product Requirements Document",
      sections: [
        {
          title: "Product Goals",
          items: [
            { id: "GOAL1", text: "Increase water infrastructure repair efficiency by 30%" },
            { id: "GOAL2", text: "Reduce average response time to < 24 hours" },
            { id: "GOAL3", text: "Provide transparent tracking for Kenyan citizens" }
          ]
        },
        {
          title: "User Personas",
          items: [
            { id: "USER1", text: "Citizen: Needs intuitive reporting and tracking" },
            { id: "USER2", text: "Admin: Needs oversight and resource optimization" },
            { id: "USER3", text: "Technician: Needs precise field data and status tools" }
          ]
        }
      ]
    }
  };

  return (
    <Layout title="System Engineering Documentation">
      <div style={styles.container}>
        <div style={styles.tabs}>
          {Object.keys(docs).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                ...styles.tab,
                ...(activeTab === key ? styles.activeTab : {}),
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={styles.content}>
          <div style={styles.header}>
            <h2 style={styles.docTitle}>{docs[activeTab as keyof typeof docs].title}</h2>
            <div style={styles.badge}>v1.0 Stable</div>
          </div>

          <div style={styles.grid}>
            {docs[activeTab as keyof typeof docs].sections.map((section, idx) => (
              <div key={idx} style={styles.card}>
                <h3 style={styles.cardTitle}>{section.title}</h3>
                <div style={styles.itemList}>
                  {section.items.map((item) => (
                    <div key={item.id} style={styles.item}>
                      <span style={styles.itemId}>{item.id}</span>
                      <span style={styles.itemText}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.footer}>
          <p>Maji Watch Engineering Standard | 2026 Academic Project</p>
        </div>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    background: '#1e293b',
    padding: '8px',
    borderRadius: '12px',
    width: 'fit-content',
  },
  tab: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: '#38bdf8',
    color: '#0f172a',
    boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
  },
  content: {
    background: '#1e293b',
    borderRadius: '24px',
    padding: '40px',
    border: '1px solid #334155',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    borderBottom: '1px solid #334155',
    paddingBottom: '20px',
  },
  docTitle: { fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: 0 },
  badge: {
    background: '#064e3b',
    color: '#10b981',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  card: {
    background: '#0f172a',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #334155',
  },
  cardTitle: { 
    fontSize: '18px', 
    fontWeight: 700, 
    color: '#38bdf8', 
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  itemList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  item: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  itemId: {
    background: '#334155',
    color: '#38bdf8',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800,
    marginTop: '2px',
    flexShrink: 0,
  },
  itemText: { color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' },
  footer: { marginTop: '40px', textAlign: 'center', color: '#475569', fontSize: '12px' },
};

export default SystemManual;

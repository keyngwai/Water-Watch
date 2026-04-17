import Layout from '../../components/shared/Layout';

const AdminFAQ = () => (
  <Layout title="Admin Help & FAQ">
    <h2>Admin Help & FAQ</h2>
    <h3>How do I filter reports by date?</h3>
    <p>Use the date filter at the top of the reports page to select a start and end date. The report list will update automatically. Filtering is by the report creation date.</p>
    <h3>How do I assign a technician?</h3>
    <p>Click on a report, then use the "Assign Technician" button to select and assign a technician.</p>
    <h3>How do I change report status?</h3>
    <p>Open a report and use the status dropdown to update its status (e.g., In Progress, Resolved).</p>
    <h3>Need more help?</h3>
    <p>Contact support or refer to the admin documentation.</p>
  </Layout>
);

export default AdminFAQ;

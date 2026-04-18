import Layout from '../../components/shared/Layout';

const AdminFAQ = () => (
  <Layout title="Admin Help & FAQ - County Administrator Guide">
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Admin Help & FAQ</h1>
      <p className="text-gray-600 mb-8">County Water Administrator Portal - Complete Guide</p>

      {/* Getting Started Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Getting Started as an Administrator</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What is my role in Maji Watch?</h3>
          <p className="text-gray-700 leading-relaxed">
            As a county water authority administrator, you are the critical link between citizen reports and field resolution. 
            Your responsibilities are to review incoming reports, verify whether they are legitimate, assign them to the right technician, 
            track progress, and mark them resolved once the work is done. Every action you take is logged permanently in the system 
            for accountability purposes.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I access the admin portal?</h3>
          <p className="text-gray-700 mb-3">
            Your account is created by your system administrator — you cannot self-register. Once your account is set up, you will receive your login credentials.
          </p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Open the Maji Watch URL in your browser</li>
            <li>Click <strong>Login</strong> and enter your email address and password</li>
            <li>Because your account has the admin role, you will be redirected automatically to the admin dashboard at <code>/admin</code></li>
          </ol>
          <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-3">
            <p className="text-sm text-red-800">
              <strong>Security note:</strong> Never share your admin login credentials. Each admin action is recorded with your user ID and timestamp. 
              If you believe your account has been compromised, contact your system administrator immediately to have your password reset.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What sections are in the admin portal?</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>Dashboard</strong> — Summary of key metrics and recent activity across your county</li>
            <li><strong>Reports</strong> — Full list of all reports with filtering and management tools</li>
            <li><strong>Map View</strong> — Live interactive map showing all reports plotted by location</li>
            <li><strong>Technicians</strong> — Management page for your team of field technicians</li>
          </ul>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Using the Dashboard</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What do the KPI cards show?</h3>
          <p className="text-gray-700 mb-3">At the top of the dashboard you will find four summary cards:</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Total Reports</strong>
              <p className="text-sm text-gray-600">Total number of reports submitted in your county to date</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-orange-600">Pending Verification</strong>
              <p className="text-sm text-gray-600">Reports submitted but not yet reviewed by an admin</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-purple-600">In Progress</strong>
              <p className="text-sm text-gray-600">Reports assigned to a technician and actively being worked on</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-green-600">Resolved</strong>
              <p className="text-sm text-gray-600">Reports that have been successfully closed</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What are the Status Distribution and Category Ranking charts?</h3>
          <p className="text-gray-700 mb-2">
            The <strong>Status Distribution</strong> bar chart shows the count of reports in each status. Use this to identify where your backlog is building. 
            If the Pending Verification bar is very high, submitted reports are waiting for your review.
          </p>
          <p className="text-gray-700">
            The <strong>Issue Category Ranking</strong> shows which water problems are most frequently reported. This helps identify systemic infrastructure issues — 
            for example, if pipe bursts are consistently at the top, the pipe network in a particular ward may need comprehensive assessment.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I use the Recent Reports table?</h3>
          <p className="text-gray-700">
            The bottom of the dashboard shows the ten most recently submitted reports, with their reference code, category, severity, and current status. 
            Click any row to go directly to that report's detail page and take action.
          </p>
        </div>
      </section>

      {/* Managing Reports Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Managing Reports</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I filter and search reports?</h3>
          <p className="text-gray-700 mb-3">
            Go to <strong>Reports</strong> in the navigation to see all reports for your county. You can filter the list by status, county, and date range. 
            Use the search bar to look up a specific report by its reference code (e.g., MJW-2026-00142) or keyword.
          </p>
          <p className="text-gray-700">
            Each row shows the reference code, title, category, severity, status, upvote count, and submission date. 
            Click the row to open the full report detail, including photos, the citizen's description, GPS location, and the activity timeline.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I verify a report?</h3>
          <p className="text-gray-700 mb-3">When a new report comes in, its status is <strong>Reported</strong>. Your first task is to verify whether the problem is real.</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Click the report from the Reports table or Recent Reports section</li>
            <li>Review the description, photos, and map location. Cross-reference with other reports in that area if necessary</li>
            <li>Click the <strong>Verify</strong> button in the Status Actions panel on the right</li>
            <li>Confirm the action in the dialogue. The status changes to <strong>Verified</strong> and the action is recorded in the audit log</li>
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I reject a report?</h3>
          <p className="text-gray-700 mb-3">If a report is a duplicate, outside your county's jurisdiction, or cannot be substantiated:</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Navigate to the report from the Reports table</li>
            <li>Click the <strong>Reject</strong> button in the Status Actions panel</li>
            <li>Type a clear, professional rejection reason. If <em>is_public</em> is checked, the citizen will see this reason</li>
            <li>Click <strong>Confirm Rejection</strong>. The status changes to <strong>Rejected</strong> and the reason is logged</li>
          </ol>
          <p className="text-sm text-gray-600 mt-2 italic">
            Best practice: Always provide a specific rejection reason. Common valid reasons include: outside county jurisdiction, 
            duplicate of report MJW-YYYY-NNNNN, or insufficient evidence to verify location.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I assign a technician?</h3>
          <p className="text-gray-700 mb-3">Once a report is Verified, you can assign a field technician:</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Navigate to the verified report</li>
            <li>Click the <strong>Assign Technician</strong> button in the Status Actions panel</li>
            <li>Select from the dropdown showing all available technicians in your county (choose based on specialisation and workload)</li>
            <li>Click <strong>Assign</strong>. The technician profile appears on the report page and status changes to <strong>In Progress</strong></li>
          </ol>
          <p className="text-sm text-blue-700 mt-2">
            Tip: Go to the Technicians page to check availability before assigning. Assign only available technicians when possible.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I add comments to a report?</h3>
          <p className="text-gray-700 mb-3">
            You can add a comment to any report at any point, regardless of status. Scroll to the <strong>Add Comment</strong> section, 
            type your message, set the visibility, and click <strong>Save Comment</strong>.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>Public comment</strong> (Make Public checked): Visible to the citizen in their activity timeline. Use for updates, requesting more info, or confirming resolution.</li>
            <li><strong>Private comment</strong> (unchecked): Visible only to admins. Use for internal notes like "Field visit scheduled for Tuesday" or "Escalated to county engineer."</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I mark a report as resolved?</h3>
          <p className="text-gray-700 mb-3">When field work is complete and the problem is fixed:</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Navigate to the in-progress report</li>
            <li>Optionally, add a public comment describing what was done (e.g., "Borehole pump replaced and water restored as of 14 April 2026")</li>
            <li>Click the <strong>Mark Resolved</strong> button in the Status Actions panel</li>
            <li>The status changes to <strong>Resolved</strong>, the resolved_at timestamp is recorded, and a notification is sent to the citizen</li>
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I re-open or re-review reports?</h3>
          <p className="text-gray-700 mb-3">Infrastructure problems don't always stay fixed. Maji Watch supports two re-open paths:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>Resolved → In Progress:</strong> If a resolved issue has recurred or was not properly fixed, open the resolved report and click <strong>Re-open</strong></li>
            <li><strong>Rejected → Verified:</strong> If a report was initially rejected but subsequent investigation reveals it is legitimate, open the rejected report and click <strong>Re-review</strong></li>
          </ul>
        </div>
      </section>

      {/* Map View Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Using the Map View</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What does the map show?</h3>
          <p className="text-gray-700 mb-3">
            The Map View displays every report in your county as a coloured pin on an interactive OpenStreetMap. 
            The colour reflects the report's current status, making it easy to see which areas have unresolved problems.
          </p>
          <p className="text-gray-700">
            Use this view during morning briefings to identify hotspots, or when planning technician routes to cluster nearby jobs efficiently.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I filter reports on the map?</h3>
          <p className="text-gray-700">
            At the top of the map there are filter pills for each status: Reported, Verified, In Progress, Resolved, and Rejected. 
            Click a pill to show only reports in that status. You can activate multiple filters simultaneously. 
            For example, show only Reported and Verified to see your immediate workload.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I view report details from the map?</h3>
          <p className="text-gray-700">
            Click any pin to open a sidebar showing a summary: reference code, title, category, severity, status, and submission date. 
            Click <strong>View Full Report</strong> to go to the report detail page and take action.
          </p>
        </div>
      </section>

      {/* Managing Technicians Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Managing Technicians</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I add a new technician?</h3>
          <p className="text-gray-700 mb-3">Technician accounts are linked to user accounts:</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Click <strong>Technicians</strong> in the admin navigation</li>
            <li>Click the <strong>Add Technician</strong> button at the top</li>
            <li>Enter the technician's name, email address, phone number, specialisation (e.g., borehole repair, pipe fitting), county assignment, and employee number. A user account is created automatically.</li>
            <li>Click <strong>Save Technician</strong>. The new technician card appears on the Technicians page</li>
          </ol>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I manage technician availability?</h3>
          <p className="text-gray-700 mb-3">
            Each technician card shows their current availability status. When a technician is on leave, sick, or otherwise unavailable, 
            toggle their status to <strong>Unavailable</strong> so you don't accidentally assign reports to them.
          </p>
          <p className="text-gray-700">
            To change availability, open the technician's card and click the <strong>Availability toggle</strong>. The change takes effect immediately.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I check technician workload?</h3>
          <p className="text-gray-700">
            Each technician card shows the number of active (In Progress) assignments they currently have. 
            Use this to distribute work evenly across your team and avoid overloading individual technicians.
          </p>
        </div>
      </section>

      {/* Audit Trail Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Audit Trail and Accountability</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What is logged in the audit trail?</h3>
          <p className="text-gray-700 mb-3">
            Every action you take — verifying, rejecting, assigning, commenting, resolving, or re-opening a report — is permanently recorded. 
            These records cannot be edited or deleted. Each log entry contains:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>The action type (e.g., verified, assigned, resolved)</li>
            <li>Your admin user ID</li>
            <li>The report ID and its status before and after the action</li>
            <li>The exact date and time the action was taken</li>
            <li>Any comment entered alongside the action</li>
          </ul>
          <p className="text-gray-700 mt-3">
            The audit trail is visible in the report activity timeline. It ensures all decisions about water issue reports are transparent 
            and attributable, which is important for county accountability and infrastructure planning.
          </p>
        </div>
      </section>

      

      {/* Common Questions Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Can I delete a report that was submitted by mistake?</h4>
            <p className="text-gray-700 text-sm">No. Reports cannot be deleted from the system. This is by design — the audit trail must remain intact. If a report is clearly invalid, use the <strong>Reject</strong> action with a clear reason such as "submitted in error" or "duplicate of MJW-YYYY-NNNNN."</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Can I edit a citizen's report after it has been submitted?</h4>
            <p className="text-gray-700 text-sm">Admins cannot edit the content of a citizen's report (description, photos, or title). You can add public or internal comments to supplement the report's information.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">I accidentally verified a report that should be rejected. What do I do?</h4>
            <p className="text-gray-700 text-sm">You cannot undo a verify action directly. However, you can reject the report from the Verified status — the state machine allows a verified → rejected transition. Go to the report, click <strong>Reject</strong>, and enter the reason. The full action history remains in the audit log.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">A report has been in Verified status for a long time with no technician assigned. What should I check?</h4>
            <p className="text-gray-700 text-sm">Go to the <strong>Technicians</strong> page and check technician availability. If all technicians are at capacity, you may need to re-prioritise assignments or request additional field staff. Consider adding a private comment to the report noting the reason for delay.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">How do I handle a report that covers multiple issues at once?</h4>
            <p className="text-gray-700 text-sm">Ask the citizen (via a public comment) to submit separate reports for each distinct issue, referencing each other's codes in the descriptions. This keeps the state machine clean and ensures each problem can be tracked and resolved independently.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Can two admins work on the same report at the same time?</h4>
            <p className="text-gray-700 text-sm">Yes, but coordination is important. If two admins try to take conflicting actions simultaneously, the second action may fail with an "invalid status transition" error. Use internal comments to communicate with colleagues about which reports you are actively managing.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">The citizen says they submitted a report but I cannot find it in the system.</h4>
            <p className="text-gray-700 text-sm">Ask the citizen for their reference code (MJW-YYYY-NNNNN). Search for it using the reference code in the Reports table. If it still does not appear, the submission may have failed on the citizen's end — ask them to check their internet connection and try again, or submit on their behalf.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">How do I create admin accounts for new county staff?</h4>
            <p className="text-gray-700 text-sm">Admin accounts can only be created by the system administrator through the backend seed process or direct database entry. This is intentional — admin accounts are not self-registered. Contact your county's Maji Watch system administrator and provide the new staff member's name, email, and county assignment.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Is there a way to export report data for county planning purposes?</h4>
            <p className="text-gray-700 text-sm">Maji Watch v1.0 does not include a built-in export feature. For data export or analytics beyond what the dashboard provides, contact your system administrator who can run queries against the PostgreSQL database and produce reports in CSV or Excel format.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">What should I do if the system shows an error or stops working?</h4>
            <p className="text-gray-700 text-sm">Note the error message displayed and the action you were trying to take. Contact your Maji Watch system administrator with these details. Do not attempt to repeat the failed action multiple times, as this may create duplicate records. All errors are logged server-side with full context for debugging.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Need More Help?</h2>
        <p className="text-gray-700 mb-4">
          If you cannot find an answer to your question in this guide, please contact your Maji Watch system administrator 
          or the technical support team for your county.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>When contacting support:</strong> Include the error message (if applicable), the report reference code (if related to a specific report), 
            and the action you were attempting to perform. This helps resolve your issue faster.
          </p>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="text-center text-sm text-gray-500 pt-8 border-t">
        <p>Maji Watch is developed as part of the COMP 493 Systems Project at Egerton University.</p>
        <p>Faculty of Science, Department of Computer Science | Jeremiah Nderitu | S13/10606/22</p>
        <p className="mt-2">Version 1.0 | April 2026</p>
      </footer>
    </div>
  </Layout>
);

export default AdminFAQ;
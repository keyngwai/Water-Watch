import Layout from '../../components/shared/Layout';

const CitizenFAQ = () => (
  <Layout title="Help & FAQ - Citizen Guide"> 
    <div className="max-w-4xl mx-auto py-8 px-4">
     
      <p className="text-gray-600 mb-8">Water Access & Quality Monitoring Portal - Citizen Guide</p>

      {/* Getting Started Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Getting Started</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What is Maji Watch?</h3>
          <p className="text-gray-700 leading-relaxed">
            Maji Watch is a free online platform that allows you to report water-related problems in your community  
            such as broken boreholes, contaminated water, burst pipes, or supply shortages  directly to your county water authority. 
            Every report you submit gets a unique reference code, a clear status, and is visible to the authorities responsible for fixing it. 
            You can submit a report from your phone or computer, and track exactly what is happening with it from the same device.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What do I need to get started?</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>A smartphone, tablet, or computer with a working internet connection</li>
            <li>A valid email address and a mobile phone number</li>
            <li>Location access enabled on your device (for GPS-pinned reports)</li>
            <li>Optionally, photos of the water problem you are reporting</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I create an account?</h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>Visit the Maji Watch website on your browser</li>
            <li>Click the <strong>Register</strong> button on the homepage</li>
            <li>Fill in your full name, email address, phone number, and a password</li>
            <li>Choose your county, sub-county, and ward from the dropdown lists</li>
            <li>Click <strong>Create Account</strong>. You will be taken to your personal dashboard automatically</li>
          </ol>
          <p className="text-sm text-gray-600 mt-2 italic">
            Note: Use an email address you check regularly , status update notifications are sent there.
          </p>
        </div>
      </section>

      {/* Submitting Reports Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Submitting a Report</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I submit a water problem report?</h3>
          <p className="text-gray-700 mb-3">
            Maji Watch guides you through reporting in four simple steps. You can go back and edit any step before submitting. 
            Nothing is sent to the county until you click the final <strong>Submit</strong> button on Step 4.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <h4 className="font-semibold text-blue-700">Step 1 — Issue Type</h4>
              <p className="text-gray-700 text-sm">Choose the category (Broken Borehole, Contaminated Water, Pipe Burst, etc.), severity level (Low, Medium, High, Critical), and enter a short, clear title.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700">Step 2 — Description and Photos</h4>
              <p className="text-gray-700 text-sm">Write a clear description (20-5,000 characters). Include how long the problem has been occurring and who it affects. Attach up to 5 photos (JPEG, PNG, WebP, under 10MB each). Photos are strongly recommended for faster verification.</p>
              <p className="text-xs text-gray-500 mt-1">Privacy note: GPS coordinates are automatically stripped from your photos before storage.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700">Step 3 — Location</h4>
              <p className="text-gray-700 text-sm">Click on the map to pin the exact location. Confirm your county, sub-county, and ward. Accurate location ensures the right technician is assigned.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700">Step 4 — Review and Submit</h4>
              <p className="text-gray-700 text-sm">Review all details carefully. Click <strong>Submit Report</strong>. You will receive a unique reference code (format: MJW-YYYY-NNNNN). Save or screenshot this code!</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What issue categories can I report?</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Broken Borehole</strong>
              <p className="text-gray-600">A borehole or handpump that is not functioning or has been damaged</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Contaminated Water</strong>
              <p className="text-gray-600">Water that looks, smells, or tastes unusual, or has been confirmed unsafe</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Illegal Connection</strong>
              <p className="text-gray-600">An unauthorised tap or pipe stealing water from the supply network</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Water Shortage</strong>
              <p className="text-gray-600">No water or very low water pressure affecting your area</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Unfair Pricing</strong>
              <p className="text-gray-600">Being charged prices that don't match the official county water tariff</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Pipe Burst</strong>
              <p className="text-gray-600">A pipe that has cracked or burst, wasting water or causing flooding</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">No Water Supply</strong>
              <p className="text-gray-600">Complete absence of water supply not explained by routine maintenance</p>
            </div>
            <div className="bg-white border p-3 rounded">
              <strong className="text-blue-800">Other</strong>
              <p className="text-gray-600">Any water-related problem not covered above. Describe clearly in your title.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Reports Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Tracking Your Reports</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How can I track my reports?</h3>
          <p className="text-gray-700 mb-3">There are two ways to check on your report:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>My Reports:</strong> Log in and go to "My Reports" to see all reports you've submitted with their current statuses</li>
            <li><strong>Reference Code:</strong> Use your reference code (e.g., MJW-2026-00142) — anyone can look up a public report using the search bar on the homepage without logging in</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What do the report statuses mean?</h3>
          <div className="space-y-3">
            <div className="flex items-start bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
              <div className="flex-1">
                <strong className="text-yellow-800 block">Reported</strong>
                <p className="text-sm text-gray-700">Your report is waiting for a county administrator to review it. You will be notified when this happens.</p>
              </div>
            </div>
            <div className="flex items-start bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              <div className="flex-1">
                <strong className="text-blue-800 block">Verified</strong>
                <p className="text-sm text-gray-700">A county administrator has confirmed the problem is real. The county will assign a technician to investigate or fix it.</p>
              </div>
            </div>
            <div className="flex items-start bg-purple-50 p-3 rounded border-l-4 border-purple-400">
              <div className="flex-1">
                <strong className="text-purple-800 block">In Progress</strong>
                <p className="text-sm text-gray-700">A technician has been assigned and work has begun. Wait for the administrator to mark it resolved once complete.</p>
              </div>
            </div>
            <div className="flex items-start bg-green-50 p-3 rounded border-l-4 border-green-400">
              <div className="flex-1">
                <strong className="text-green-800 block">Resolved</strong>
                <p className="text-sm text-gray-700">The county has confirmed the problem is fixed. The issue is closed. If the problem returns, submit a new report.</p>
              </div>
            </div>
            <div className="flex items-start bg-red-50 p-3 rounded border-l-4 border-red-400">
              <div className="flex-1">
                <strong className="text-red-800 block">Rejected</strong>
                <p className="text-sm text-gray-700">The county could not verify the report, or it was a duplicate. Check the timeline for the reason. You may submit a new report with more evidence.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How do I know when my report status changes?</h3>
          <p className="text-gray-700">
            Maji Watch sends you a notification whenever the status of one of your reports changes. 
            Notifications appear inside the platform when you are logged in. If your county has SMS notifications configured, 
            you will also receive a text message on the phone number you registered with.
          </p>
        </div>
      </section>

      {/* Upvoting Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Community Participation</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">What is upvoting and why does it matter?</h3>
          <p className="text-gray-700 mb-3">
            If you see a report submitted by another citizen that describes a problem you are also experiencing, you can upvote it. 
            Upvoting tells the county administrator that more than one person is affected, which can help prioritise the response.
          </p>
          <p className="text-gray-700">
            To upvote, open the report detail page and click the <strong>Upvote</strong> button. You can upvote each report only once. 
            You cannot upvote your own reports. Reports with high upvotes are more visible to administrators and more likely to be treated as high-priority.
          </p>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Privacy & Security</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Who sees my personal information?</h3>
          <p className="text-gray-700">
            County administrators can see your display name linked to reports you submitted. Your phone number and email address 
            are not shared through the public report pages. Photo metadata (GPS coordinates) is automatically stripped from all 
            uploaded images before storage.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Who sees my report?</h3>
          <p className="text-gray-700">
            Your report is visible to county administrators and relevant technicians for resolution. 
            Report details (excluding your personal contact information) are also visible to other citizens who may want to upvote 
            the issue if they are affected by the same problem.
          </p>
        </div>
      </section>

      {/* Common Questions Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Common Questions</h2>
        
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Do I have to create an account to see reports?</h4>
            <p className="text-gray-700 text-sm">No. Anyone can view public reports and their statuses without creating an account. However, you must be logged in to submit a report, upload photos, or upvote an issue.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">I forgot my password. How do I reset it?</h4>
            <p className="text-gray-700 text-sm">Password reset is managed by the county administrator. Contact your county water authority office with your registered email address, and they will arrange a reset for you.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">How long does it take for my report to be reviewed?</h4>
            <p className="text-gray-700 text-sm">This depends on your county authority's workload. Critical and high-severity reports are displayed prominently in the admin dashboard to encourage faster attention.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">My report was rejected. What should I do?</h4>
            <p className="text-gray-700 text-sm">Open your report and read the rejection reason in the activity timeline. Common reasons include location outside jurisdiction, insufficient evidence, or duplicate reports. If you believe the rejection was incorrect, submit a new report with additional photos and a more detailed description.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Can I edit my report after submitting it?</h4>
            <p className="text-gray-700 text-sm">Once a report is submitted, citizens cannot edit it. If you made a significant error, you can submit a new report with the correct information.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Can I report a problem on behalf of someone else?</h4>
            <p className="text-gray-700 text-sm">Yes. If a neighbour or community member does not have access to the platform, you can submit a report on their behalf. Describe in the report that you are reporting on behalf of the affected community.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">My area has no internet. Can I still use Maji Watch?</h4>
            <p className="text-gray-700 text-sm">Maji Watch requires an internet connection to submit and view reports. If you have intermittent connectivity, you can prepare your report details offline and submit when you have a signal. Ensure your GPS location is accurate at the time of submission.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">What happens if the problem recurs after being marked resolved?</h4>
            <p className="text-gray-700 text-sm">Submit a new report for the recurring problem. In the description, mention that this issue was previously reported (include the original reference code) and that it has returned. This history helps the county decide whether a deeper infrastructure fix is needed.</p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">I submitted a report but cannot see it in My Reports.</h4>
            <p className="text-gray-700 text-sm">Try refreshing the page. If it still doesn't appear after a few minutes, check your internet connection. If the problem persists, note the reference code from the confirmation screen and contact your county administrator.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 border-b pb-2">Need More Help?</h2>
        <p className="text-gray-700 mb-4">
          If you cannot find an answer to your question in this guide, please contact your county water authority office 
          or the system administrator for your county.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> When contacting support, have your reference code (if applicable) and registered email address ready 
            to help them assist you faster.
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

export default CitizenFAQ;
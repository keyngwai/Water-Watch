# Software Requirements Specification (SRS): Functional Requirements

## 1. User Authentication & Profile Management
- **FR1.1**: Citizens shall be able to register using email, password, full name, phone number, and county.
- **FR1.2**: All users shall be able to login securely with email and password.
- **FR1.3**: The system shall support multiple roles: Citizen, Admin, and Technician.
- **FR1.4**: Users shall be able to request a password reset via email.
- **FR1.5**: Admins shall be able to manage user accounts (deactivate/activate).

## 2. Citizen Reporting Module
- **FR2.1**: Citizens shall be able to submit reports for water issues (e.g., broken borehole, contaminated water, pipe burst).
- **FR2.2**: Reports shall include a title, description, category, severity, and GPS coordinates.
- **FR2.3**: Citizens shall be able to upload multiple photos as evidence for each report.
- **FR2.4**: The system shall automatically generate a unique reference code for each report.
- **FR2.5**: Citizens shall be able to view a history of their own submitted reports.

## 3. Community Engagement
- **FR3.1**: Citizens shall be able to upvote reports submitted by others to signal community priority.
- **FR3.2**: Citizens shall be able to view a public dashboard of reported issues in their county.
- **FR3.3**: The system shall allow users to toggle upvotes on and off.

## 4. Admin Management Dashboard
- **FR4.1**: Admins shall be able to view all reports on an interactive map.
- **FR4.2**: Admins shall be able to filter reports by status, category, date, and county.
- **FR4.3**: Admins shall be able to verify, reject, or update the status of any report.
- **FR4.4**: Admins shall be able to assign field technicians to specific reports.
- **FR4.5**: Admins shall be able to add internal or public comments to report timelines.

## 5. Technician Management
- **FR5.1**: Admins shall be able to create and manage technician profiles.
- **FR5.2**: The system shall track technician availability and current workload (active assignments).
- **FR5.3**: Technicians shall be able to view reports assigned to them.

## 6. Analytics & Reporting
- **FR6.1**: The system shall generate real-time statistics on report status, categories, and trends.
- **FR6.2**: Admins shall be able to export filtered report data in CSV format.
- **FR6.3**: Admins shall be able to export professional PDF summaries of reports and analytics.

## 7. Real-time Notifications
- **FR7.1**: Admins shall receive real-time notifications when a new report is submitted.
- **FR7.2**: Citizens shall receive updates when the status of their report changes.

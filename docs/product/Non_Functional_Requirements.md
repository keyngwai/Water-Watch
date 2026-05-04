# Software Requirements Specification (SRS): Non-Functional Requirements

## 1. Security
- **NFR1.1**: All passwords shall be hashed using `bcrypt` with a minimum cost factor of 12.
- **NFR1.2**: Authentication shall be handled via secure JWT (JSON Web Tokens) with short-lived access tokens and secure, httpOnly refresh cookies.
- **NFR1.3**: The system shall implement Role-Based Access Control (RBAC) to ensure users only access authorized data.
- **NFR1.4**: All API communication shall be encrypted over HTTPS.
- **NFR1.5**: Sensitive user data (e.g., location coordinates) shall be handled in compliance with Kenyan data protection regulations.

## 2. Performance
- **NFR2.1**: The API shall respond to 95% of standard requests (excluding file uploads) within 300ms.
- **NFR2.2**: The system shall support up to 100 concurrent users without significant performance degradation.
- **NFR2.3**: Map rendering and report clustering shall be optimized for low-latency interactions even with thousands of data points.

## 3. Scalability
- **NFR3.1**: The system architecture shall support horizontal scaling of the Express.js API.
- **NFR3.2**: The database shall be optimized with appropriate indexing (especially on geospatial columns) to handle growth in report volume.
- **NFR3.3**: Image storage shall utilize an external cloud provider (Supabase Storage) to offload heavy file serving.

## 4. Availability & Reliability
- **NFR4.1**: The system shall aim for 99.9% uptime.
- **NFR4.2**: The database shall implement automated daily backups.
- **NFR4.3**: Graceful error handling shall be implemented on both frontend and backend to prevent system crashes and provide meaningful user feedback.

## 5. Usability
- **NFR5.1**: The user interface shall be responsive and fully functional on mobile devices, tablets, and desktops.
- **NFR5.2**: The system shall provide intuitive feedback for all user actions (e.g., loading states, success/error toasts).
- **NFR5.3**: Navigation shall be straightforward, requiring no more than 3 clicks to reach any major feature.

## 6. Maintainability
- **NFR6.1**: The codebase shall be written in TypeScript to ensure type safety and reduce runtime errors.
- **NFR6.2**: Comprehensive documentation shall be maintained for all API endpoints and system components.
- **NFR6.3**: The system shall include automated integration and unit tests for critical business logic (Auth, Reports).

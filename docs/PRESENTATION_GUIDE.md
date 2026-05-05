# Maji Watch: Project Presentation & Technical Defense Guide

This guide is designed to help you present the Maji Watch system effectively and defend your technical choices during a project presentation or code review.

---

## 1. Project Introduction (The "Why")
**The Problem**: Water infrastructure management in many regions is fragmented. Citizens face challenges reporting issues, and authorities lack precise, real-time data to prioritize repairs.
**The Solution**: Maji Watch—a unified digital ecosystem that connects citizens directly with county water authorities using geospatial data and real-time monitoring.

---

## 2. System Architecture (The "How")
The project uses a **Decoupled Full-Stack Architecture**:

### **Frontend (The Interface)**
- **React (Vite)**: For a fast, responsive Single Page Application.
- **TypeScript**: Ensures type safety and reduces runtime bugs.
- **Zustand**: Lightweight state management for user sessions.
- **React Query**: Handles server state, caching, and background data synchronization.
- **Leaflet**: Powering the interactive geospatial maps.

### **Backend (The Engine)**
- **Node.js & Express**: Scalable RESTful API.
- **PostgreSQL + PostGIS**: Relational database with specialized geography support.
- **Socket.io**: Enabling real-time "Push" notifications.
- **Sharp & pdf-lib**: For high-performance image processing and document generation.

---

## 3. Integration Flow: How Data Moves
1.  **Reporting**: A Citizen submits a report via the React frontend.
2.  **API Handling**: The Express backend validates the input and PostGIS converts coordinates into a `GEOGRAPHY` point.
3.  **Storage**: Images are processed (resized/stripped of EXIF) and sent to Supabase Storage.
4.  **Real-time Alert**: The server emits a `new_report` event via Socket.io to all connected Admin dashboards.
5.  **Admin Action**: The Admin views the report on a Leaflet map, filters by severity, and assigns a Technician.
6.  **Notification**: The system records an audit log and notifies the Citizen of the status change.

---

## 4. Technical Deep Dive: Explaining the Code

### **A. Geospatial Queries (PostGIS)**
*Question: "How do you find reports near a user?"*
**Code Reference**: [reports.service.ts](file:///c:/Users/Zangetsu/Documents/Downloads/maji-watch/backend/src/services/reports.service.ts)
**Explanation**: We use the `ST_DWithin` function. Unlike standard SQL, PostGIS treats the `location_geom` column as a point on a sphere. This allows us to find reports within a specific radius (e.g., 5km) efficiently using spatial indexing.

### **B. Secure Authentication (JWT & Cookies)**
*Question: "How do you keep users logged in securely?"*
**Code Reference**: [auth.service.ts](file:///c:/Users/Zangetsu/Documents/Downloads/maji-watch/backend/src/services/auth.service.ts)
**Explanation**: We use a **Dual-Token System**. 
1.  **Access Token**: Short-lived (15 mins), stored in memory/localStorage for API calls.
2.  **Refresh Token**: Long-lived, stored in a **Secure, httpOnly Cookie**. This prevents XSS scripts from stealing the session, as cookies marked `httpOnly` cannot be accessed via JavaScript.

### **C. Real-time Notifications (Socket.io)**
*Question: "How does the admin see new reports without refreshing?"*
**Code Reference**: [socket.ts](file:///c:/Users/Zangetsu/Documents/Downloads/maji-watch/backend/src/utils/socket.ts)
**Explanation**: When `reportsService.createReport` succeeds, the controller calls `emitNotification`. This sends a message over an open WebSocket connection to all clients with the 'admin' role, triggering a toast notification in the frontend instantly.

### **D. Image Processing (Sharp)**
*Question: "How do you handle large image uploads?"*
**Code Reference**: [upload.service.ts](file:///c:/Users/Zangetsu/Documents/Downloads/maji-watch/backend/src/services/upload.service.ts)
**Explanation**: We don't store raw images. We use the **Sharp** library to resize images to a maximum of 1200px and convert them to **WebP** format. This reduces file size by ~70% and removes privacy-sensitive EXIF (GPS/camera) data.

---

## 5. Key Features & Highlights

- **Interactive Map Visualization**: Using clustering to show thousands of reports without lagging.
- **State-Machine Workflow**: Reports follow a strict path (Reported -> Verified -> In Progress -> Resolved).
- **Automated Reporting**: Admins can generate professional PDF summaries for board meetings with one click.
- **Community Prioritization**: An upvoting system that allows communities to "signal boost" critical issues.

---

## 6. Future Scalability
- **Mobile App**: The REST API is already structured to support a React Native mobile application.
- **AI Integration**: Future plans include using Computer Vision to automatically categorize issues based on uploaded photos.
- **SMS Integration**: Supporting USSD/SMS reporting for citizens with basic feature phones.

---

## 7. Conclusion
Maji Watch isn't just a reporting tool; it's a transparency engine. By integrating geospatial data, real-time alerts, and automated workflows, it transforms how communities and governments interact to protect their most vital resource: water.

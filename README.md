# VillageConnect 2.0

A full-stack web application that connects citizens with local leaders to report, track, and resolve problems in their village/community.

VillageConnect provides a transparent workflow where citizens can submit problems with images/videos, track their status, receive notifications, and view resolution proof. Leaders can manage reported problems, update their status, maintain status history, and upload proof after resolving an issue.

---

## Features

### Citizen

- Citizen registration and login
- Secure role-based authentication
- Citizen dashboard
- Submit a new problem/report
- Add:
  - Title
  - Description
  - Category
  - Area/location
  - Image
  - Video
- View all submitted reports
- Track report status:
  - PENDING
  - IN_PROGRESS
  - RESOLVED
- View complete status history
- View resolution proof
- Receive notifications
- Manual and automatic dashboard refresh
- Protected citizen routes
- Logout functionality

### Leader

- Secure leader login
- Leader dashboard
- View all citizen reports
- Filter reports by:
  - Category
  - Status
- Update problem status
- View problem status history
- Resolve reported problems
- Upload resolution proof:
  - Image
  - Video
- Citizens can verify the uploaded resolution proof
- Dashboard statistics
- Automatic dashboard refresh
- Protected leader routes

---

## Application Workflow

```text
Citizen
   |
   v
Register / Login
   |
   v
Citizen Dashboard
   |
   v
Report a Problem
   |
   v
Leader Reviews Report
   |
   v
Status Update
(PENDING -> IN_PROGRESS)
   |
   v
Problem Resolved
   |
   v
Resolution Proof Uploaded
   |
   v
Citizen Verifies Resolution
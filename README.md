# ReachInbox Email Scheduler

A full-stack email scheduling application built for the ReachInbox hiring assignment.

The application allows users to schedule emails, process them through BullMQ workers, apply sender-level rate limits and delays, search emails using Elasticsearch, and view email delivery status through the dashboard.

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- TypeScript
- Express.js
- Prisma ORM

### Infrastructure
- PostgreSQL
- Redis
- BullMQ
- Elasticsearch
- Docker / Docker Compose

### Email
- Ethereal Email / SMTP

### Notifications
- Slack Webhooks

---

# How to Run

## Prerequisites

Make sure the following are installed:

- Node.js 18+
- npm
- Docker Desktop
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/NarasimhaMurthy1107/reachinbox-scheduler.git
cd reachinbox-scheduler

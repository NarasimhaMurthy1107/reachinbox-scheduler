# ReachInbox Email Scheduler

A full-stack email scheduling application built as part of the ReachInbox hiring assignment.

The application supports scheduling emails, sending emails through a worker queue, handling multiple senders, rate limiting, searching emails, and tracking email status.

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
- Express
- Prisma

### Database / Infrastructure

- PostgreSQL
- Redis
- BullMQ
- Elasticsearch
- Docker

### Email

- Ethereal SMTP

---

## Features

- User login with demo login
- Google OAuth login
- Schedule emails for a future time
- Send emails using BullMQ workers
- Support multiple sender accounts
- Per-sender rate limiting
- Retry failed jobs
- Cancel scheduled emails
- Search emails using Elasticsearch
- View scheduled and sent emails
- Track completed, failed, delayed and rate-limited jobs
- Slack webhook integration
- BullMQ queue monitoring
- Docker setup for PostgreSQL, Redis and Elasticsearch

---

# Setup Instructions

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

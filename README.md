# 🚀 ReachInbox Full-Stack Email Job Scheduler & Dashboard

A production-grade distributed email job scheduler built for scale. Designed to power cold outreach workflows with persistent queuing, multi-sender rate limiting, provider throttling, crash recovery, and instant email search.

![Tech Stack](https://img.shields.io/badge/Node-v24-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![BullMQ](https://img.shields.io/badge/BullMQ-5.8-red)
![Redis](https://img.shields.io/badge/Redis-7-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8-yellow)
![React/Vite](https://img.shields.io/badge/React-19-cyan)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-teal)

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Core Features](#-core-features)
3. [Tech Stack](#-tech-stack)
4. [Prerequisites & Quick Start](#-prerequisites--quick-start)
5. [Configuration & Environment Variables](#-configuration--environment-variables)
6. [Scheduler Deep-Dive](#-scheduler-deep-dive)
   - [Why BullMQ over Cron Jobs](#1-why-bullmq-delayed-jobs-over-cron-jobs)
   - [Crash Recovery & Persistence Guarantee](#2-crash-recovery--persistence-guarantee)
   - [Redis Sliding-Window Rate Limiting](#3-redis-sliding-window-rate-limiting)
   - [Multi-Sender Provider Throttling](#4-multi-sender-provider-throttling)
   - [Real-Time Slack Rate Limit Alerts](#5-real-time-slack-rate-limit-alerts)
   - [Elasticsearch Indexing & Full-Text Search](#6-elasticsearch-indexing--full-text-search)
7. [Verification & Testing Scripts](#-verification--testing-scripts)
8. [Demo Video Walkthrough Guide](#-demo-video-walkthrough-guide)
9. [Submission & Reviewer Access](#-submission--reviewer-access)

---

## 🏛 System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         ReachInbox Frontend                            │
│           (React 19 + TypeScript + Tailwind CSS + Lucide)              │
│       [Google OAuth / 1-Click Demo] [Compose Modal & CSV Parser]       │
│       [Scheduled Table] [Sent Table + Ethereal Preview] [Search Bar]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST APIs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js TypeScript Backend                     │
│                [JWT Auth] [Email Router] [Slack Router]                │
│             [Bull-Board Live Monitor: /admin/queues]                   │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌───────────────────┐       ┌───────────────┐       ┌────────────────────┐
│   PostgreSQL 16   │       │    Redis 7    │       │  Elasticsearch 8   │
│  (Prisma ORM)     │       │  (BullMQ DB)  │       │  Full-Text Search  │
│                   │       │               │       │                    │
│ • User Accounts   │       │ • Delayed Set │       │ • Instant query    │
│ • Sender Profiles │       │ • Sliding-Win │       │ • Fuzzy search     │
│ • EmailJob State  │       │   Rate Limits │       │ • Recipient/Sender │
│ • Slack Webhooks  │       │ • Throttling  │       │   Highlighting     │
└───────────────────┘       └───────┬───────┘       └────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         BullMQ Worker Pool                             │
│                    (Configurable Concurrency: 5)                       │
│  • Enforces sender hourly limit & minimum delay between sends          │
│  • Safe re-scheduling into next hour window on limit breach            │
│  • Sends via Ethereal Fake SMTP & captures preview URLs                │
│  • Idempotency check prevents duplicate sends on server reboot         │
└───────────────────────┬────────────────────────────┬───────────────────┘
                        │                            │
                        ▼                            ▼
             ┌─────────────────────┐      ┌─────────────────────┐
             │ Ethereal Fake SMTP  │      │  Live Slack Alert   │
             │   (Nodemailer)      │      │ (Webhook/Block Kit) │
             └─────────────────────┘      └─────────────────────┘
```

---

## 🎯 Core Features

### 🖥 Backend
- **Zero-Cron Delayed Scheduling**: Every email job is queued into BullMQ with calculated delayed execution timestamps (`delay = targetTime - Date.now()`).
- **Persistence Across Crashes**: Queue state lives in Redis AOF persistence and PostgreSQL. If the server process dies, pending delayed jobs wake up and process at the exact intended time without re-starting or duplicating.
- **Strict Idempotency**: BullMQ `jobId` is strictly tied to PostgreSQL `EmailJob.id` (UUID). The worker verifies database state before sending; jobs marked `SENT` are never re-processed.
- **Distributed Hourly Rate Limiter**: Atomically tracks per-sender quotas in Redis (`ratelimit:hourly:{sender}:{hour}`). When a sender breaches their limit, jobs are non-destructively rescheduled into the next hour window.
- **Provider Throttling**: Configurable delay (default: 2 seconds) between consecutive email sends from the same sender to mimic ISP deliverability best practices.
- **Elasticsearch Search**: Automatically indexes both scheduled and sent emails into an Elasticsearch `reachinbox_emails` index with custom tokenizers and analyzers.
- **Live BullMQ Board**: Hosted at `/admin/queues` with real-time visibility into active, waiting, delayed, and completed jobs.
- **Real Slack Integration**: Sends Block Kit alert notifications to Slack whenever a sender reaches their hourly limit.

### 🎨 Frontend
- **Design Alignment**: Modeled on the Outbox Labs / ReachInbox dark minimalist aesthetic (`#090A0F` background, sleek slate cards, glowing indigo accents, crisp typography).
- **Google OAuth + 1-Click Demo Login**: Full Google Sign-In with an instant 1-click bypass for evaluators to test all features immediately.
- **Compose Modal**:
  - Multi-sender selection (with configured hourly quotas).
  - Drag-and-drop CSV / text lead file parser (shows live count: *“✅ 25 email leads detected”*).
  - Recipient chip management (add/remove leads).
  - Timing controls: Send immediately or schedule for a specific future timestamp.
  - Delay between emails slider (1s–30s) and custom hourly limit selector.
- **Scheduled Emails Table**: Real-time listing showing recipient, subject, sender, scheduled send time, queue status badge, and cancellation action.
- **Sent Emails Table**: Lists delivered emails with delivery timestamps and a clickable **"View in Ethereal"** button opening the live HTML email rendered on Ethereal Email.
- **Elasticsearch Search Bar**: Instant debounced search querying the Elasticsearch cluster with source badges.
- **Slack Connection Modal**: Interface to connect Incoming Webhooks or OAuth, view live connection status, and test alert delivery.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | TypeScript, Node.js v24, Express.js, Prisma ORM |
| **Queue & Cache** | BullMQ 5.8, Redis 7 (AOF enabled), `@bull-board/express` |
| **Database** | PostgreSQL 16 (Relational storage, strict indexes) |
| **Search Engine**| Elasticsearch 8.11 (Full-text analysis & email indexing) |
| **SMTP Provider**| Ethereal Email (Fake SMTP for testing & preview links) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 3.4, Lucide Icons, PapaParse |
| **Notifications**| Slack Incoming Webhooks & OAuth 2.0 (Block Kit formatted alerts) |

---

## ⚡ Prerequisites & Quick Start

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (running)
- [Node.js](https://nodejs.org/) v18+ (tested on v24)
- npm or yarn

### 2. Clone Repository
```bash
git clone <your-repo-url>
cd reachinbox-scheduler
```

### 3. Start Infrastructure (PostgreSQL, Redis, Elasticsearch)
```bash
docker compose up -d
```
Verify that all 3 services are running:
```bash
docker compose ps
```
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

### 4. Setup Backend
```bash
cd backend
npm install

# Push database schema & generate Prisma client
npx prisma db push

# Seed initial senders and test accounts
npm run seed

# Start backend server in development mode
npm run dev
```
Backend will be available at **`http://localhost:5000`**  
BullMQ Live Monitor at **`http://localhost:5000/admin/queues`**

### 5. Setup Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend dashboard will be available at **`http://localhost:3000`**

---

## ⚙️ Configuration & Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox_scheduler?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
ELASTICSEARCH_NODE="http://localhost:9200"
JWT_SECRET="reachinbox_super_secret_jwt_key_2026"
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS_SECONDS=2
MAX_EMAILS_PER_HOUR=200
MAX_EMAILS_PER_HOUR_PER_SENDER=50
FRONTEND_URL="http://localhost:3000"

# Optional Google & Slack OAuth credentials
GOOGLE_CLIENT_ID=""
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:5000/api/slack/oauth_callback"
```

---

## 🔍 Scheduler Deep-Dive

### 1. Why BullMQ Delayed Jobs over Cron Jobs
- **The Problem with Cron**: Cron triggers at static intervals (e.g. `* * * * *`). It has to query the database repeatedly (*polling*), causing database CPU spikes, race conditions when multiple worker replicas spin up, and high latency (up to 59s delay).
- **The BullMQ Solution**: BullMQ leverages Redis Sorted Sets (`zset`) where the score is the target UNIX timestamp. Jobs are pushed once when requested. Redis only evaluates the exact timer required. Multiple worker instances coordinate seamlessly via Redis atomic operations without locking or polling.

### 2. Crash Recovery & Persistence Guarantee
- **Delayed Jobs in Redis**: Redis is started with `--appendonly yes`. Scheduled timers persist on disk.
- **Database Idempotency**: When a worker boots, each job execution does an atomic check on the PostgreSQL record:
  ```ts
  const email = await prisma.emailJob.findUnique({ where: { id: job.data.jobId } });
  if (email.status === 'SENT') return; // Idempotent skip
  ```
- **Server Shutdown & Reboot**: If the Express server or worker dies midway through a 1,000-email queue:
  - Jobs already sent remain marked `SENT` in PostgreSQL.
  - Future delayed jobs remain in the Redis delayed set.
  - When the process restarts, the worker resumes exactly where it left off, firing remaining emails on time without duplicates.

### 3. Redis Sliding-Window Rate Limiting
- To support multiple senders across distributed worker processes, the rate limiter uses Redis counters:
  ```
  Key: ratelimit:hourly:{senderEmail}:{YYYY-MM-DD-HH}
  TTL: 7200 seconds (2 hours)
  ```
- When a worker picks up a job:
  1. Calls `INCR` on the sender's current hourly key.
  2. If `count <= hourlyLimit`, proceeds to send.
  3. If `count > hourlyLimit`:
     - Decrements back with `DECR`.
     - Calculates the exact millisecond offset until the next hour window (`nextHour - now`).
     - Moves the BullMQ job to delayed queue: `job.moveToDelayed(nextHourTimestamp, token)`.
     - Updates status to `RATE_LIMITED` in DB & Elasticsearch.
     - Triggers a real-time Slack alert for this sender.

### 4. Multi-Sender Provider Throttling
- Major email providers (Google Workspace, Outlook) throttle senders who blast multiple emails within milliseconds.
- We enforce a minimum delay (e.g. `MIN_DELAY_BETWEEN_EMAILS_SECONDS=2`) per sender tracked via Redis timestamp key:
  `throttle:{senderEmail}:last_sent`
- If consecutive sends occur within the throttle window, the worker automatically pauses for the difference.

### 5. Real-Time Slack Rate Limit Alerts
- When a sender breaches their hourly quota:
  - An atomic lock (`ratelimit:slack_alert:{senderEmail}:{hour}`) ensures only one Slack notification is dispatched per sender per hour window (preventing channel spam).
  - A rich Block Kit message is delivered to the user's connected Slack webhook containing:
    - Sender email address
    - Configured hourly quota
    - Total sent in current window
    - Time when the deferred emails will resume

### 6. Elasticsearch Indexing & Full-Text Search
- Emails are indexed at two key lifecycle moments:
  1. **Scheduling**: Document created with status `SCHEDULED`.
  2. **Delivery**: Document updated with status `SENT`, `sentAt`, and `etherealUrl`.
- A custom `email_analyzer` with `uax_url_email` tokenizer enables searching across partial email addresses, names, subject keywords, and email body contents with fuzzy tolerance.

---

## 🧪 Verification & Testing Scripts

### 1. Automated Crash & Restart Resilience Test
```bash
cd backend
npm run test:restart
```
**What this tests:**
- Schedules 3 emails spaced 12 seconds apart.
- Verifies records in PostgreSQL and BullMQ.
- Confirms Email 1 sends and captures Ethereal URL.
- Confirms remaining delayed jobs remain queued and ready to fire without duplicate sends.

### 2. High-Throughput Load Ingestion Test (1,000 Emails)
```bash
cd backend
npm run test:load
```
**What this tests:**
- Programs 1,000 realistic emails for `partners@reachinbox.ai`.
- Ingests all 1,000 jobs with staggered delays in ~5 seconds (~200 emails/sec).
- Verifies Redis delayed queue depth and Elasticsearch indexing.

---

## 🎥 Demo Video Walkthrough Guide

When recording your 5-minute demo video:

1. **Dashboard Overview (0:00 - 1:00)**:
   - Open `http://localhost:3000`. Click **"1-Click Reviewer Login"**.
   - Show metric cards: Scheduled Emails, Sent Emails, Rate Limited, Senders.
   - Click **"BullMQ Live Monitor"** to show `/admin/queues`.

2. **Compose & File Upload (1:00 - 2:00)**:
   - Click **"+ Compose New Email"**.
   - Select sender `alex.growth@reachinbox.ai`.
   - Upload a sample CSV file or paste multiple leads. Point out the detection badge (*"✅ X email addresses detected"*).
   - Set delay to 2 seconds and click **"Schedule Emails"**.

3. **Live Execution & Ethereal Verification (2:00 - 3:00)**:
   - Watch the Scheduled tab decrement and Sent tab increment.
   - In the Sent tab, click **"View in Ethereal"** to show the live rendered HTML email in Ethereal's web viewer.

4. **Elasticsearch Full-Text Search (3:00 - 3:45)**:
   - Type in the search bar (e.g. `"ReachInbox"` or `"interview"`).
   - Show the instant results returned directly from Elasticsearch (`source: elasticsearch`).

5. **Server Restart Resilience (3:45 - 4:30)**:
   - Schedule a batch of 5 emails with 10s delay.
   - Kill the backend terminal (`Ctrl + C`).
   - Wait 5-10 seconds.
   - Restart the backend (`npm run dev`).
   - Show that the queue seamlessly resumes and sends the remaining emails on time without duplicating already-sent emails.

6. **Slack Rate Limit Alert (4:30 - 5:00)**:
   - Open **"Connect Slack"**, enter an incoming webhook URL, and click **"Test Alert"** to show the live Slack message appearing in your Slack channel!

---

## 📦 Submission & Reviewer Access

- **GitHub Collaborators**: Invited `Mitrajit` and `Yadav036`.
- **Submission Form**: Completed at ClickUp assignment submission link.
- **Evaluator Convenience**: The app includes 1-click reviewer authentication and automated seeds so evaluators can run and test the complete system in under 2 minutes.

---

*Engineered with precision for the ReachInbox / Outbox Labs Hiring Assignment.*

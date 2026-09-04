import axios from 'axios';

async function runLoadTest() {
  console.log('===========================================================');
  console.log('🚀 Starting ReachInbox Scheduler Load Test (1,000 emails)');
  console.log('===========================================================');
  const API_URL = 'http://localhost:5000/api/emails/schedule';

  // Generate 1,000 realistic leads
  const recipients = Array.from(
    { length: 1000 },
    (_, i) => `lead.${i + 1}.scale@enterprise-${(i % 50) + 1}.io`
  );

  const payload = {
    senderEmail: 'partners@reachinbox.ai',
    senderName: 'ReachInbox Partnerships',
    recipients,
    subject: 'High-Scale Outreach: Automated Lead Verification & Sequence',
    body: 'Hi there, ReachInbox handles high-volume cold email scheduling with distributed workers, Redis rate limits, and Ethereal SMTP verification.',
    delayBetweenEmailsSeconds: 2,
    hourlyLimit: 100,
  };

  const startTime = Date.now();
  console.log(`⏱️ Ingesting batch of ${recipients.length} emails into scheduler...`);

  try {
    const response = await axios.post(API_URL, payload, {
      timeout: 60000,
    });
    const elapsed = Date.now() - startTime;

    console.log('\n===========================================================');
    console.log('✅ Load Test Ingestion Passed!');
    console.log(`⏱️ Total Ingestion Time: ${elapsed}ms (${(recipients.length / (elapsed / 1000)).toFixed(1)} emails/sec)`);
    console.log(`📦 Batch ID: ${response.data.batchId}`);
    console.log(`📊 Total Scheduled: ${response.data.totalScheduled}`);
    console.log(`📅 First Scheduled: ${response.data.firstScheduledAt}`);
    console.log(`📅 Last Scheduled: ${response.data.lastScheduledAt}`);
    console.log(`🛡️ Rate Limit: ${response.data.hourlyLimit} emails/hr per sender`);
    console.log('===========================================================');
    console.log('👉 Check live queue visualization at: http://localhost:5000/admin/queues\n');
  } catch (err: any) {
    console.error('❌ Load test failed:', err?.response?.data || err.message);
  }
}

runLoadTest();

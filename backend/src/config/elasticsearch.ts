import { Client } from '@elastic/elasticsearch';
import { config } from './env';

export const esClient = new Client({
  node: config.elasticsearchNode,
  requestTimeout: 10000,
});

export const EMAIL_INDEX = 'reachinbox_emails';

export async function initElasticsearch(): Promise<void> {
  try {
    const health = await esClient.cluster.health({});
    console.log(`✅ Elasticsearch cluster health: ${health.status}`);

    const indexExists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        body: {
          settings: {
            analysis: {
              analyzer: {
                email_analyzer: {
                  type: 'custom',
                  tokenizer: 'uax_url_email',
                  filter: ['lowercase'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              senderEmail: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
                analyzer: 'email_analyzer',
              },
              recipientEmail: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
                analyzer: 'email_analyzer',
              },
              subject: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              etherealUrl: { type: 'keyword' },
              batchId: { type: 'keyword' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      console.log(`✅ Created Elasticsearch index: ${EMAIL_INDEX}`);
    } else {
      console.log(`ℹ️ Elasticsearch index ${EMAIL_INDEX} already exists`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Elasticsearch init warning (will retry on demand): ${error.message}`);
  }
}

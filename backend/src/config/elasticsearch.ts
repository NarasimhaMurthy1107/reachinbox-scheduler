import { Client } from '@elastic/elasticsearch';
import { config } from './env';

export const esClient = new Client({
  node: config.elasticsearchNode,
  requestTimeout: 10000,
});

export const EMAIL_INDEX = 'reachinbox_emails';

export async function initElasticsearch(): Promise<void> {
  console.log('ℹ️ Elasticsearch disabled for this deployment');
}
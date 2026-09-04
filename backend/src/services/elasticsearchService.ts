import { esClient, EMAIL_INDEX } from '../config/elasticsearch';

export interface EmailDocument {
  id: string;
  userId?: string | null;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date | string;
  sentAt?: Date | string | null;
  etherealUrl?: string | null;
  batchId?: string | null;
  createdAt: Date | string;
}

export async function indexEmail(doc: EmailDocument): Promise<void> {
  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: doc.id,
      body: {
        ...doc,
        scheduledAt: new Date(doc.scheduledAt).toISOString(),
        sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
        createdAt: new Date(doc.createdAt).toISOString(),
      },
      refresh: 'wait_for',
    });
  } catch (error: any) {
    console.error(`⚠️ Elasticsearch index error for ${doc.id}:`, error.message);
  }
}

export async function updateEmailInEs(id: string, partial: Partial<EmailDocument>): Promise<void> {
  try {
    const updateBody: any = { ...partial };
    if (partial.sentAt) updateBody.sentAt = new Date(partial.sentAt).toISOString();
    if (partial.scheduledAt) updateBody.scheduledAt = new Date(partial.scheduledAt).toISOString();

    await esClient.update({
      index: EMAIL_INDEX,
      id,
      body: {
        doc: updateBody,
      },
      refresh: 'wait_for',
    });
  } catch (error: any) {
    console.error(`⚠️ Elasticsearch update error for ${id}:`, error.message);
  }
}

export async function searchEmails(queryStr: string, status?: string, senderEmail?: string) {
  try {
    const mustQueries: any[] = [];

    if (queryStr && queryStr.trim().length > 0) {
      mustQueries.push({
        multi_match: {
          query: queryStr,
          fields: ['subject^3', 'body^2', 'recipientEmail^4', 'senderEmail^2'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      mustQueries.push({ match_all: {} });
    }

    const filterQueries: any[] = [];
    if (status) {
      filterQueries.push({ term: { status } });
    }
    if (senderEmail) {
      filterQueries.push({ term: { 'senderEmail.keyword': senderEmail } });
    }

    const result = await esClient.search({
      index: EMAIL_INDEX,
      body: {
        query: {
          bool: {
            must: mustQueries,
            filter: filterQueries,
          },
        },
        sort: [{ scheduledAt: { order: 'desc' } }],
        size: 100,
        highlight: {
          fields: {
            subject: {},
            body: {},
            recipientEmail: {},
          },
        },
      },
    });

    const hits = (result.hits.hits || []).map((hit: any) => ({
      ...hit._source,
      highlight: hit.highlight,
    }));

    return {
      total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value || hits.length,
      emails: hits,
    };
  } catch (error: any) {
    console.error('⚠️ Elasticsearch search error:', error.message);
    return null; // Signals controller to fallback to DB if ES is temporarily down
  }
}

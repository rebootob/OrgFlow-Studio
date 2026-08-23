import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { env } from '../../config/env.js';
import { EXCLUDED_SENSITIVE_FIELDS, KintoneRawRecord } from './kintone.types.js';

export class KintoneReadOnlyClient {
  private client: KintoneRestAPIClient | null = null;

  constructor() {
    if (env.KINTONE_BASE_URL && env.KINTONE_READ_API_TOKEN) {
      this.client = new KintoneRestAPIClient({
        baseUrl: env.KINTONE_BASE_URL,
        auth: {
          apiToken: env.KINTONE_READ_API_TOKEN
        }
      });
    }
  }

  /**
   * Fetches all records from a specified Kintone App in batches using offset pagination.
   * STRICTLY READ-ONLY.
   */
  async fetchAllRecords(appId: number, fields?: string[]): Promise<KintoneRawRecord[]> {
    if (!this.client) {
      console.warn(`[KintoneReadOnlyClient] Real API client not configured. Returning empty or fixture.`);
      return [];
    }

    const safeFields = fields
      ? fields.filter(f => !EXCLUDED_SENSITIVE_FIELDS.includes(f as any))
      : undefined;

    const allRecords: KintoneRawRecord[] = [];
    const limit = 500;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const resp = await this.client.record.getRecords({
        app: appId,
        query: `limit ${limit} offset ${offset}`,
        fields: safeFields
      });

      allRecords.push(...(resp.records as KintoneRawRecord[]));
      if (resp.records.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    return allRecords;
  }
}

export const kintoneClient = new KintoneReadOnlyClient();
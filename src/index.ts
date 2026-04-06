import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getAuthClient } from './auth.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const server = new McpServer({
  name: 'Play Console MCP Server',
  version: '1.0.0',
});

// Helper for default package name
const getPackageName = (pkgName?: string) => pkgName || process.env.DEFAULT_PACKAGE_NAME;

// --- Reviews Management ---
server.tool(
  'list_reviews',
  'List recent reviews for an app',
  {
    packageName: z.string().optional().describe('App package name. Uses DEFAULT_PACKAGE_NAME if omitted.'),
    maxResults: z.number().optional().default(10),
  },
  async ({ packageName, maxResults }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.reviews.list({ packageName: pkg, maxResults });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'reply_review',
  'Reply to a specific review',
  {
    packageName: z.string().optional().describe('App package name. Uses DEFAULT_PACKAGE_NAME if omitted.'),
    reviewId: z.string().describe('The ID of the review to reply to.'),
    replyText: z.string().describe('The text of the reply.'),
  },
  async ({ packageName, reviewId, replyText }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      await client.reviews.reply({
        packageName: pkg,
        reviewId,
        requestBody: { replyText },
      });
      return { content: [{ type: 'text', text: `Successfully replied to review ${reviewId}` }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

// --- App Publishing ---
server.tool(
  'create_edit',
  'Start a new edit for app publishing/store listing updates',
  {
    packageName: z.string().optional().describe('App package name. Uses DEFAULT_PACKAGE_NAME if omitted.'),
  },
  async ({ packageName }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.insert({ packageName: pkg });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'upload_aab',
  'Upload an Android App Bundle (AAB) to an active edit',
  {
    packageName: z.string().optional().describe('App package name.'),
    editId: z.string().describe('Active edit ID (from create_edit).'),
    aabPath: z.string().describe('Absolute path to the .aab file.'),
  },
  async ({ packageName, editId, aabPath }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.bundles.upload({
        packageName: pkg,
        editId,
        media: {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(aabPath)
        }
      });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'assign_track',
  'Assign an uploaded bundle/apk to a track (e.g., production, beta)',
  {
    packageName: z.string().optional().describe('App package name.'),
    editId: z.string().describe('Active edit ID.'),
    track: z.string().describe('Track name (production, beta, alpha, internal).'),
    versionCode: z.number().describe('The version code of the uploaded APK/AAB.'),
    status: z.string().optional().default('completed').describe('Status (completed, draft, halted, inProgress)'),
  },
  async ({ packageName, editId, track, versionCode, status }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.tracks.update({
        packageName: pkg,
        editId,
        track,
        requestBody: {
          releases: [
            {
              versionCodes: [versionCode.toString()],
              status,
            }
          ]
        }
      });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'commit_edit',
  'Commit an active edit to save all changes',
  {
    packageName: z.string().optional().describe('App package name.'),
    editId: z.string().describe('Active edit ID.'),
  },
  async ({ packageName, editId }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.commit({ packageName: pkg, editId });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

// --- Store Listing ---
server.tool(
  'get_store_listing',
  'Get store listing texts for a specific language',
  {
    packageName: z.string().optional().describe('App package name.'),
    editId: z.string().describe('Active edit ID.'),
    language: z.string().describe('Language code (e.g., en-US, es-ES).'),
  },
  async ({ packageName, editId, language }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.listings.get({
        packageName: pkg,
        editId,
        language,
      });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'update_store_listing',
  'Update store listing texts (title, fullDescription, shortDescription)',
  {
    packageName: z.string().optional().describe('App package name.'),
    editId: z.string().describe('Active edit ID.'),
    language: z.string().describe('Language code (e.g., en-US, es-ES).'),
    title: z.string().optional(),
    shortDescription: z.string().optional(),
    fullDescription: z.string().optional(),
  },
  async ({ packageName, editId, language, title, shortDescription, fullDescription }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.edits.listings.update({
        packageName: pkg,
        editId,
        language,
        requestBody: {
          title,
          shortDescription,
          fullDescription,
        }
      });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

// --- Data Safety ---
server.tool(
  'update_data_safety',
  'Update Data Safety declaration using a CSV string',
  {
    packageName: z.string().optional().describe('App package name.'),
    safetyLabelsCsv: z.string().describe('The Data Safety CSV content as a string.'),
  },
  async ({ packageName, safetyLabelsCsv }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      await (client as any).applications.dataSafety({
        packageName: pkg,
        requestBody: {
          safetyLabels: safetyLabelsCsv
        }
      });
      return { content: [{ type: 'text', text: 'Successfully updated Data Safety declaration.' }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

// --- Subscriptions / In-App Products ---
server.tool(
  'list_inapp_products',
  'List managed in-app products (one-time purchases)',
  {
    packageName: z.string().optional().describe('App package name.'),
  },
  async ({ packageName }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.inappproducts.list({ packageName: pkg });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'list_subscriptions',
  'List in-app subscriptions (recurring purchases)',
  {
    packageName: z.string().optional().describe('App package name.'),
  },
  async ({ packageName }) => {
    try {
      const pkg = getPackageName(packageName);
      if (!pkg) throw new Error('Package name is required.');
      const client = await getAuthClient();
      const res = await client.monetization.subscriptions.list({ packageName: pkg });
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Play Console MCP Server running on stdio');
}

run().catch(console.error);

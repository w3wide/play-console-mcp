import { ResourceTemplate } from '@modelcontextprotocol/server';
import { getAuth } from './auth.js';
import { getPackageName } from './utils.js';

export const registerResources = (server: any) => {
    // 1. App Details Resource
    server.registerResource(
        'app_details',
        new ResourceTemplate('playconsole://apps/{packageName}/details', {
            list: undefined,
        }),
        {
            name: 'App Contact & Language Details',
            description: 'Retrieve app-wide contact info (email, phone, website) and default language.',
            mimeType: 'application/json',
        },
        async (uri: any, variables: { packageName: string }) => {
            try {
                const pkg = getPackageName(variables.packageName);
                const { publisher } = await getAuth();
                const editRes = await publisher.edits.insert({ packageName: pkg });
                const editId = editRes.data.id;

                if (!editId) {
                    throw new Error('Failed to create temporary edit session.');
                }

                const detailsRes = await publisher.edits.details.get({ packageName: pkg, editId });
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(detailsRes.data, null, 2),
                        },
                    ],
                };
            } catch (e: any) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({ error: e.message || String(e) }, null, 2),
                        },
                    ],
                };
            }
        }
    );

    // 2. Store Listing Text Metadata Resource
    server.registerResource(
        'store_listing',
        new ResourceTemplate('playconsole://apps/{packageName}/listings/{language}', {
            list: undefined,
        }),
        {
            name: 'Localized Store Listing Metadata',
            description: 'Retrieve localized title, short description, and full description for a language.',
            mimeType: 'application/json',
        },
        async (uri: any, variables: { packageName: string; language: string }) => {
            try {
                const pkg = getPackageName(variables.packageName);
                const { publisher } = await getAuth();
                const editRes = await publisher.edits.insert({ packageName: pkg });
                const editId = editRes.data.id;

                if (!editId) {
                    throw new Error('Failed to create temporary edit session.');
                }

                const listingRes = await publisher.edits.listings.get({
                    packageName: pkg,
                    editId,
                    language: variables.language || 'en-US',
                });

                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(listingRes.data, null, 2),
                        },
                    ],
                };
            } catch (e: any) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({ error: e.message || String(e) }, null, 2),
                        },
                    ],
                };
            }
        }
    );

    // 3. In-App Products Catalog Resource
    server.registerResource(
        'inapp_products_catalog',
        new ResourceTemplate('playconsole://apps/{packageName}/inapp-products', {
            list: undefined,
        }),
        {
            name: 'In-App Products Catalog',
            description: 'Retrieve configured one-time purchase catalog products for an app.',
            mimeType: 'application/json',
        },
        async (uri: any, variables: { packageName: string }) => {
            try {
                const pkg = getPackageName(variables.packageName);
                const { publisher } = await getAuth();
                const productsRes = await publisher.monetization.onetimeproducts.list({ packageName: pkg });

                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(productsRes.data, null, 2),
                        },
                    ],
                };
            } catch (e: any) {
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({ error: e.message || String(e) }, null, 2),
                        },
                    ],
                };
            }
        }
    );
};

import { z } from 'zod';
import { registerListingTools } from '../src/tools/listing.js';

describe('Listing Tools Input Schema', () => {
    const registeredTools: Map<string, any> = new Map();
    const mockServer = {
        registerTool: (name: string, config: any, handler: any) => {
            registeredTools.set(name, { config, handler });
        },
    };

    beforeAll(() => {
        registerListingTools(mockServer);
    });

    describe('update_store_listing', () => {
        let schema: z.ZodObject<any>;

        beforeAll(() => {
            const tool = registeredTools.get('update_store_listing');
            schema = z.object(tool.config.inputSchema);
        });

        it('should validate correct inputs', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
                language: 'en-US',
                title: 'Valid Title',
                shortDescription: 'Valid Short Description',
                fullDescription: 'Valid Full Description',
            });
            expect(result.success).toBe(true);
        });

        it('should reject titles longer than 50 characters', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
                language: 'en-US',
                title: 'a'.repeat(51),
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at most 50 character(s)');
            }
        });

        it('should reject short descriptions longer than 80 characters', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
                language: 'en-US',
                shortDescription: 'a'.repeat(81),
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at most 80 character(s)');
            }
        });

        it('should reject full descriptions longer than 4000 characters', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
                language: 'en-US',
                fullDescription: 'a'.repeat(4001),
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at most 4000 character(s)');
            }
        });
    });
});

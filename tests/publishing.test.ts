import { z } from 'zod';
import { registerPublishingTools } from '../src/tools/publishing.js';

describe('Publishing Tools Input Schema', () => {
    const registeredTools: Map<string, any> = new Map();
    const mockServer = {
        registerTool: (name: string, config: any, handler: any) => {
            registeredTools.set(name, { config, handler });
        },
    };

    beforeAll(() => {
        registerPublishingTools(mockServer);
    });

    describe('get_track', () => {
        let schema: z.ZodObject<any>;

        beforeAll(() => {
            const tool = registeredTools.get('get_track');
            schema = z.object(tool.config.inputSchema);
        });

        it('should validate correct inputs', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
                track: 'production',
            });
            expect(result.success).toBe(true);
        });

        it('should require track name', () => {
            const result = schema.safeParse({
                editId: 'edit-123',
            });
            expect(result.success).toBe(false);
        });
    });
});

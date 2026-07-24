import { getPackageName, wrapError, wrapJson, wrapText } from '../src/utils.js';

describe('Utils', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('getPackageName', () => {
        it('should return the passed package name', () => {
            expect(getPackageName('com.test.app')).toBe('com.test.app');
        });

        it('should fallback to process.env.DEFAULT_PACKAGE_NAME', () => {
            process.env.DEFAULT_PACKAGE_NAME = 'com.env.app';
            expect(getPackageName()).toBe('com.env.app');
        });

        it('should throw an error if no package name is configured', () => {
            delete process.env.DEFAULT_PACKAGE_NAME;
            expect(() => getPackageName()).toThrow();
        });
    });

    describe('wrapJson', () => {
        it('should wrap object in content structure', () => {
            const data = { success: true };
            const wrapped = wrapJson(data);
            expect(wrapped).toEqual({
                content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
            });
        });
    });

    describe('wrapText', () => {
        it('should wrap text in content structure', () => {
            const wrapped = wrapText('hello world');
            expect(wrapped).toEqual({
                content: [{ type: 'text', text: 'hello world' }],
            });
        });
    });

    describe('wrapError', () => {
        it('should wrap standard errors', () => {
            const err = new Error('Test error message');
            const wrapped = wrapError(err);
            expect(wrapped.isError).toBe(true);
            expect(wrapped.content[0].text).toContain('Test error message');
        });

        it('should append 403 access denied tip', () => {
            const err = { message: 'Access Denied', code: 403 };
            const wrapped = wrapError(err);
            expect(wrapped.content[0].text).toContain('Access denied (403)');
        });

        it('should append insufficient scope tip for 403 scopes error', () => {
            const err = { message: 'Request had insufficient authentication scopes', code: 403 };
            const wrapped = wrapError(err);
            expect(wrapped.content[0].text).toContain('insufficient authentication scopes');
        });

        it('should append 404 not found tip', () => {
            const err = { message: 'App not found', code: 404 };
            const wrapped = wrapError(err);
            expect(wrapped.content[0].text).toContain('Resource not found (404)');
        });

        it('should append 429 quota tip', () => {
            const err = { message: 'Rate limit exceeded', code: 429 };
            const wrapped = wrapError(err);
            expect(wrapped.content[0].text).toContain('Quota or rate limit exceeded (429)');
        });

        it('should append 400 bad request tip', () => {
            const err = { message: 'Invalid track', code: 400 };
            const wrapped = wrapError(err);
            expect(wrapped.content[0].text).toContain('Bad request (400)');
        });
    });
});

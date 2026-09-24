import { execSync } from 'child_process';

describe('CLI Integration Tests', () => {
    it('should display top-level help with all available subcommands', () => {
        const output = execSync('node build/index.js --help').toString();
        const expectedSubcommands = [
            'mcp',
            'setup',
            'edit',
            'reviews',
            'reporting',
            'listing',
            'images',
            'inapp',
            'subscriptions',
        ];

        for (const subcmd of expectedSubcommands) {
            expect(output).toContain(subcmd);
        }
    });

    it('should display help for mcp subcommand', () => {
        const output = execSync('node build/index.js mcp --help').toString();
        expect(output).toContain('Usage: play-console mcp');
        expect(output).toContain('Start the Stdio MCP server for Google Play Console');
    });
});

import { execSync } from 'child_process';

describe('CLI Integration Tests', () => {
    it('should display top-level help with all available subcommands', () => {
        const output = execSync('node build/index.js --help').toString();
        const expectedSubcommands = [
            'mcp',
            'setup',
            'doctor',
            'config',
            'wizard',
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

    it('should display help for wizard subcommand', () => {
        const output = execSync('node build/index.js wizard --help').toString();
        expect(output).toContain('Usage: play-console wizard');
        expect(output).toContain('Run interactive step-by-step wizard to publish an app release');
    });
});

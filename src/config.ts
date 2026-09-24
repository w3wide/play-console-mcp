import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PlayConsoleConfig {
    keyFile?: string;
    packageName?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'play-console');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Loads configuration from ~/.config/play-console/config.json
 */
export function loadConfig(): PlayConsoleConfig {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch {
        // Fallback to empty config on parse error
    }
    return {};
}

/**
 * Saves configuration to ~/.config/play-console/config.json
 */
export function saveConfig(config: PlayConsoleConfig): void {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    } catch (err: any) {
        console.error(`Error saving config to ${CONFIG_FILE}: ${err.message}`);
    }
}

/**
 * Gets a specific config value by key.
 */
export function getConfigValue(key: keyof PlayConsoleConfig): string | undefined {
    const config = loadConfig();
    return config[key];
}

/**
 * Sets a specific config value by key.
 */
export function setConfigValue(key: keyof PlayConsoleConfig, value: string): void {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}

/**
 * Unsets a specific config value by key.
 */
export function unsetConfigValue(key: keyof PlayConsoleConfig): void {
    const config = loadConfig();
    delete config[key];
    saveConfig(config);
}

export function getConfigPath(): string {
    return CONFIG_FILE;
}

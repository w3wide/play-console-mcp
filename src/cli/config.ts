import { loadConfig, getConfigPath, setConfigValue, unsetConfigValue, PlayConsoleConfig } from '../config.js';

export function handleConfigShow() {
    const config = loadConfig();
    const configPath = getConfigPath();

    console.log(`Configuration File: ${configPath}\n`);
    if (Object.keys(config).length === 0) {
        console.log('No settings configured yet. Run "play-console setup" to configure.');
        return;
    }

    console.log(JSON.stringify(config, null, 2));
}

export function handleConfigGet(key: string) {
    const config = loadConfig();
    const val = config[key as keyof PlayConsoleConfig];
    if (val !== undefined) {
        console.log(val);
    } else {
        console.log(`Key "${key}" is not set.`);
    }
}

export function handleConfigSet(key: string, value: string) {
    if (key !== 'keyFile' && key !== 'packageName') {
        console.error(`Invalid config key "${key}". Valid keys are: keyFile, packageName`);
        process.exit(1);
    }
    setConfigValue(key as keyof PlayConsoleConfig, value);
    console.log(`[SUCCESS] Updated ${key} = ${value}`);
}

export function handleConfigUnset(key: string) {
    if (key !== 'keyFile' && key !== 'packageName') {
        console.error(`Invalid config key "${key}". Valid keys are: keyFile, packageName`);
        process.exit(1);
    }
    unsetConfigValue(key as keyof PlayConsoleConfig);
    console.log(`[SUCCESS] Unset ${key}`);
}

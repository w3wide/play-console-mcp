import { loadConfig, saveConfig, getConfigValue, setConfigValue, unsetConfigValue } from '../src/config.js';

describe('Persistent Config Manager', () => {
    it('should save and load configuration cleanly', () => {
        const testConfig = { keyFile: '/path/to/key.json', packageName: 'com.test.app' };
        saveConfig(testConfig);

        const loaded = loadConfig();
        expect(loaded.keyFile).toBe('/path/to/key.json');
        expect(loaded.packageName).toBe('com.test.app');
    });

    it('should set and get config values', () => {
        setConfigValue('packageName', 'com.example.updated');
        expect(getConfigValue('packageName')).toBe('com.example.updated');
    });

    it('should unset config values', () => {
        unsetConfigValue('packageName');
        expect(getConfigValue('packageName')).toBeUndefined();
    });
});

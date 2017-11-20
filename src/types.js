
export const ConfiguratorPathError = {
    name: 'ConfiguratorPathError',
    message: 'Invalid directory "%s": %s',
};

export const ConfiguratorSettingsTypeError = {
    name: 'ConfiguratorSettingsTypeError',
    message: 'Invalid settings %s, expected {%s}, got "%s"',
};

export const ConfiguratorSettingsPathError = {
    name: 'ConfiguratorSettingsPathError',
    message: 'Invalid settings.path: %s',
};

export const ConfiguratorFileError = {
    name: 'ConfiguratorFileError',
    message: 'Invalid "%s" configuration: %s was not found',
};

export const ConfiguratorParseError = {
    name: 'ConfiguratorParseError',
    message: 'Invalid "%s" configuration: %s',
};

export default {
    pathError: ConfiguratorPathError,
    settingsTypeError: ConfiguratorSettingsTypeError,
    settingsPathError: ConfiguratorSettingsPathError,
    fileError: ConfiguratorFileError,
    parseError: ConfiguratorParseError,
};

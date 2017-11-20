import Thrower from '@gik/tools-thrower';
import { Is } from '@gik/tools-checker';
import { Exists, Load, PathLoad } from './utils';
import {
    ConfiguratorSettingsTypeError as SettingsTypeError,
    ConfiguratorSettingsPathError as SettingsPathError,
} from './types';

export const Path = PathLoad();

export const Settings = {
    name: 'default',
    ext: '.json',
    path: Path.etc,
};

const NODE_ENV = String(process.env.NODE_ENV).trim();
export const Env = (NODE_ENV === 'undefined' || NODE_ENV === '')
    ? 'development'
    : process.env.NODE_ENV;

/**
 * @description Load data from json (compatible) files according to current environment.
 * when no environment is specified `development` is assumed.
 *
 * ###### Example
 *
 * Assuming the following directory structure and `process.env.NODE_ENV = 'production'`:
 *
 * ```
 *  ⎿ etc
 *     ├ default.json -> { "a": { "a1":"one", "a2":"two" , "aa": "${a.a1}${a.a2}"} }
 *     ⎿ default-production.json -> { "a": { "ab": "${a.aa}-b" }, "b": true }
 * ```
 * The result would be:
 *
 * ```js
 * { a: { a1: 'one', a2: 'two', aa: 'onetwo', ab: 'onetwo-b' }, b: true }
 * ```
 * @param {Object} [settings] - Settings to customize behaviour.
 * @param {string} [settings.name=default] - The name for the config files.
 * @param {string} [settings.path=Path.etc] - The path where config files are located.
 * @param {string} [settings.ext=.json] - The extension filter for config files.
 * @returns {Object} - The result of the merge of the common and environment file.
 * @throws {ConfiguratorSettingsTypeError} - When sent an invalid settings parameter.
 * @throws {ConfiguratorSettingsPathError} - When settings.path cannot be found.
 * @throws {ConfiguratorFileError} - When a file cannot be loaded.
 * @throws {ConfiguratorParseError} - When an error occurs when loading a file.
 */
export function Configurator(settings = {}) {
    if (!Is.object(settings)) {
        const message = [SettingsTypeError.message, '', 'Object', typeof settings];
        Thrower(message, SettingsTypeError.name);
    }
    const { name, path, ext } = Object.assign({}, Settings, settings);
    const { message: emsg, name: enam } = SettingsTypeError;
    if (!Is.string(name)) Thrower([emsg, '.name', 'string', typeof name], enam);
    if (!Is.string(ext)) Thrower([emsg, '.ext', 'string', typeof ext], enam);
    if (!Is.string(path)) Thrower([emsg, '.path', 'string', typeof path], enam);
    if (!Exists(path, 'directory')) {
        const message = [SettingsPathError.message, path];
        Thrower(message, SettingsPathError.name);
    }
    return [name, `${name}-${Env}`].reduce(Load.bind({ path, ext }), {});
}

export default Configurator;

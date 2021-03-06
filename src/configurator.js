import FS from 'fs';
import PATH from 'path';
import DeepMerge from 'deepmerge';
import Populator from '@gik/tools-populator';
import Thrower from '@gik/tools-thrower';
import Tmp from 'tmp';
import { Is } from '@gik/tools-checker';
import {
    ConfiguratorPathError as PathError,
    ConfiguratorFileError as FileError,
    ConfiguratorParseError as ParseError,
    ConfiguratorSettingsTypeError as SettingsTypeError,
    ConfiguratorSettingsPathError as SettingsPathError,
} from './types';

/**
 * @private
 * @description Determine if given target is of given type.
 * @param {string} path - A full path to target.
 * @param {string} type - Either `directory` or `file`.
 * @returns {boolean} - Whether if the target corresponds to file.
 */
function Exists(path, type) {
    const name = `is${type[0].toUpperCase()}${type.slice(1)}`;
    return FS.existsSync(path) && FS.statSync(path)[name]();
}

/**
 * @module Path
 * @memberof configurator
 * @description Returns full paths for the directories declard con package.json
 */
const directoriesKey = 'npm_package_directories_';
export const Path = Object
    .keys(process.env)
    .filter(key => key.indexOf(directoriesKey) === 0)
    .reduce((acc, key) => {
        const name = key.replace(directoriesKey, '');
        const path = PATH.resolve(process.env[key]);
        if (!Exists(path, 'directory'))
            Thrower([PathError.message, name, path], PathError.name);
        return { ...acc, [name]: path };
    }, {
        root: process.cwd(),
    });

export const Settings = {
    name: 'default',
    ext: '.json',
    path: Path.etc,
    delete: true,
};

/**
 * @module Env
 * @memberof configurator
 * @description Returns the current environment.
 */
const NODE_ENV = String(process.env.NODE_ENV).trim();
export const Env = (NODE_ENV === 'undefined' || NODE_ENV === '')
    ? 'development'
    : process.env.NODE_ENV;

/**
 * @private
 * @description A reducer that loads a config file and merges it with current one.
 * @param {string} config - The accumulated config file.
 * @param {string} base  - The basename of current config file.
 * @property {Object} this - The context for the reducer.
 * @property {string} this.path - The path specified on settings.
 * @property {string} this.ext - The extension specified on settings.
 * @returns {Object} - The result of the merge.
 */
function Load(config, base) {
    const { path, ext } = this;
    const filename = PATH.join(path, base + ext);
    if (!Exists(filename, 'file')) {
        const message = [FileError.message, base, filename];
        Thrower(message, FileError.name);
    }
    let result;
    try {
        result = require(filename);
        result = { Path, Env, ...DeepMerge.all([config, result]) };
        result = Populator(result);
    } catch (error) {
        const message = [ParseError.message, base, error.message];
        Thrower(message, ParseError.name);
    }
    return result;
}
/**
 * @module configurator
 * @description Load data from json (compatible) files according to current environment.
 * when no environment is specified `development` is assumed.
 *
 * As an added bonus, the contents of `Path` and `Env` will be available to you when
 * populating the configuration.
 *
 * ###### Example
 *
 * Assuming the following directory structure and `process.env.NODE_ENV = 'production'`:
 *
 * ```
 *  └ etc
 *     ├ default.json -> {
 *     |    "a": {
 *     |        "a1": "one",
 *     |        "a2": "two",
 *     |        "aa": "${a.a1}${a.a2}"
 *     |    }
 *     | }
 *     └ default-production.json -> {
 *           "a": {
 *               "ab": "${a.aa}-b"
 *           },
 *           "b": "${Env}"
 *       }
 * ```
 * The result would be:
 *
 * ```js
 * {
 *     a: {
 *         a1: 'one',
 *         a2: 'two',
 *         aa: 'onetwo',
 *         ab: 'onetwo-b'
 *     },
 *     b: 'production'
 * }
 * ```
 * @param {Object} [settings] - Settings to customize behaviour.
 * @param {string|Array} [settings.name=default] - The name for the config files.
 * if an array is sent, will process specified names in order.
 * @param {string} [settings.path=Path.etc] - The path where config files are located.
 * @param {string} [settings.ext=.json] - The extension filter for config files.
 * @param {boolean} [settings.delete=true] - Remove `Path` and `Env` after merging.
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
    if (!Is.string(ext)) Thrower([emsg, '.ext', 'string', typeof ext], enam);
    if (!Is.string(path)) Thrower([emsg, '.path', 'string', typeof path], enam);
    if (!Is.string(name) && !Is.array(name))
        Thrower([emsg, '.name', 'string|Array', typeof name], enam);
    if (!Exists(path, 'directory')) {
        const message = [SettingsPathError.message, path];
        Thrower(message, SettingsPathError.name);
    }
    const config = (Is.string(name) ? [name] : name)
        .reduce((acc, target) => acc.concat([target, `${target}-${Env}`]), [])
        .reduce(Load.bind({ path, ext }), {});
    delete config.Env;
    delete config.Path;
    return config;
}

/**
 * @module WebpackResolverPlugin
 * @memberof configurator
 * @description Allows to implement the same functionality of `configurator`
 * to generate a module that will be internally resolved by webpack.
 *
 * ###### Example
 * Adding the following to your webpack config:
 *
 * ```js
 * { ...
 *   resolve: {
 *     plugins: [ WebpackResolverPlugin('#config', { path: './config' }) ]
 *   }
 * }
 * ```
 *
 * Would make the configuration available on a module, like the following:
 *
 * ```js
 * // your webpack source
 * import Config from '#config';
 * console.log(Config); // would output the parsed config on `./config`
 * ```
 *
 * @param {string} id - The identifier that you'll use to import the module.
 * @param {Object} settings - The settings to be passed to the `configurator`.
 */
export function WebpackResolverPlugin(id, settings) {
    // Create a temporay file with the module contents
    Tmp.setGracefulCleanup(); // deletes file even after uncaught exceptions.
    const path = Tmp.fileSync({ prefix: 'configurator-', postfix: '.json' }).name;
    FS.writeFileSync(path, JSON.stringify(Configurator(settings)), 'utf8');
    // return the plugin that will consume the tmpFile.
    return {
        apply(compiler) {
            compiler.plugin('described-resolve', function ModuleResolver(req, cbak) {
                if (req.request !== id) return cbak();
                this.doResolve('resolve', { ...req, request: path }, null, cbak);
            });
        },
    };
}

export default Configurator;

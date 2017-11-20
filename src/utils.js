import FS from 'fs';
import PATH from 'path';
import DeepMerge from 'deepmerge';
import Populator from '@gik/tools-populator';
import Thrower from '@gik/tools-thrower';
import {
    ConfiguratorPathError as PathError,
    ConfiguratorFileError as FileError,
    ConfiguratorParseError as ParseError,
} from './types';

/**
 * @private
 * @description Determine if given target is of given type.
 * @param {string} path - A full path to target.
 * @param {string} type - Either `directory` or `file`.
 * @returns {boolean} - Whether if the target corresponds to file.
 */
export function Exists(path, type) {
    const name = `is${type[0].toUpperCase()}${type.slice(1)}`;
    return FS.existsSync(path) && FS.statSync(path)[name]();
}

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
export function Load(config, base) {
    const { path, ext } = this;
    const filename = PATH.join(path, base + ext);
    if (!Exists(filename, 'file')) {
        const message = [FileError.message, base, filename];
        Thrower(message, FileError.name);
    }
    let result;
    try {
        result = require(filename);
        result = Populator(DeepMerge.all([config, result]));
    } catch (error) {
        const message = [ParseError.message, base, error.message];
        Thrower(message, ParseError.name);
    }
    return result;
}


const directoriesKey = 'npm_package_directories_';

/**
 * @private
 * @description Obtains all the directories defined on npm_package_directories.
 */
export const PathLoad = () => Object
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

export default {
    exists: Exists,
    load: Load,
};

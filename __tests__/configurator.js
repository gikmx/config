/* globals test, jest, expect, describe */
import PATH from 'path';
import { Is } from '@gik/tools-checker';
import { Replacer } from '@gik/tools-thrower';
import {
    ConfiguratorPathError as PathError,
    ConfiguratorSettingsPathError as SettingsPathError,
    ConfiguratorSettingsTypeError as SettingsTypeError,
    ConfiguratorFileError as FileError,
    ConfiguratorParseError as ParseError,
} from '../lib/types';

const pathCases = PATH.join(__dirname, 'cases');
const pathMain = PATH.resolve(process.env.npm_package_main);

describe('The exposed Path property', () => {

    test('should be an object', () => {
        const { Path } = require(pathMain);
        expect(Is.object(Path)).toBe(true);
        expect(Is.objectEmpty(Path)).toBe(false);
        jest.resetModules();
    });

    test('should throw an error when directory not found', () => {
        process.env.npm_package_directories_DELME = './notfound';
        import(pathMain).catch((error) => {
            expect(error.name).toBe(PathError.name);
            expect(error.message).toBe(Replacer(
                PathError.message,
                ['DELME', PATH.resolve('./notfound')],
            ));
            delete process.env.npm_package_directories_DELME;
            delete require.cache[require.resolve(pathMain)];
            jest.resetModules();
        });
    });
});

describe('The exposed Env property', () => {

    test('should be a string matching current environment', () => {
        const env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'RESETME';
        const { Env } = require(pathMain);
        expect(Is.string(Env)).toBe(true);
        expect(Env).toEqual(process.env.NODE_ENV);
        process.env.NODE_ENV = env;
        jest.resetModules();
    });

});

describe('The exposed Configurator method', () => {

    test('should also be the default module', () => {
        const Configurator = require(pathMain).default;
        jest.resetModules();
        const { Configurator: ConfiguratorProp } = require(pathMain);
        expect(Is.function(Configurator)).toBe(true);
        expect(Configurator.toString()).toEqual(ConfiguratorProp.toString());
        jest.resetModules();
    });

    test('should throw when sent invalid settings', () => {
        expect.assertions(2);
        const { Configurator } = require(pathMain);
        try {
            Configurator('invalid');
        } catch (error) {
            expect(error.name).toBe(SettingsTypeError.name);
            expect(error.message).toBe(Replacer(
                SettingsTypeError.message,
                ['', 'Object', 'string'],
            ));
        }
        jest.resetModules();
    });

    const props = [
        { name: 'name', valid: 'default', invalid: 0 },
        { name: 'path', valid: './404', invalid: 0 },
        { name: 'ext', valid: '.json', invalid: 0 },
    ];

    const settingsValid = props
        .reduce((acc, { name, valid }) => ({ ...acc, [name]: valid }), {});

    props.forEach(prop => test(`should throw when sent invalid prop ${prop.name}`, () => {
        expect.assertions(2);
        const { name, invalid, valid } = prop;
        const settings = props
            .filter(({ name: propName }) => name !== propName)
            .reduce((acc, { name: key, valid: val }) => ({ ...acc, [key]: val }), {});
        const { Configurator } = require(pathMain);
        try {
            Configurator({ ...settings, [name]: invalid });
        } catch (error) {
            const type = name === 'name' ? 'string|Array' : typeof valid;
            expect(error.name).toBe(SettingsTypeError.name);
            expect(error.message).toBe(Replacer(
                SettingsTypeError.message,
                [`.${name}`, type, typeof invalid],
            ));
        } finally {
            jest.resetModules();
        }
    }));

    test('should throw when prop path is not found', () => {
        expect.assertions(2);
        const path = './invalid-directory';
        const { Configurator } = require(pathMain);
        try {
            Configurator({ ...settingsValid, path });
        } catch (error) {
            expect(error.name).toBe(SettingsPathError.name);
            expect(error.message).toBe(Replacer(SettingsPathError.message, [path]));
        } finally {
            jest.resetModules();
        }
    });

    test('should throw when base file is not found', () => {
        expect.assertions(2);
        const { Configurator } = require(pathMain);
        const path = PATH.join(pathCases, '01');
        const settings = { ...settingsValid, path };
        try {
            Configurator(settings);
        } catch (error) {
            expect(error.name).toBe(FileError.name);
            expect(error.message).toBe(Replacer(
                FileError.message,
                [settings.name, PATH.join(path, settings.name + settings.ext)],
            ));
        } finally {
            jest.resetModules();
        }
    });

    test('should throw when file is not valid', () => {
        expect.assertions(2);
        const { Configurator } = require(pathMain);
        const path = PATH.join(pathCases, '02');
        const settings = { ...settingsValid, path };
        try {
            Configurator(settings);
        } catch (error) {
            expect(error.name).toBe(ParseError.name);
            expect(error.message).toBe(Replacer(
                ParseError.message,
                [settings.name, 'Unexpected end of JSON input'],
            ));
        } finally {
            jest.resetModules();
        }
    });

    test('should throw when environment file is not found', () => {
        expect.assertions(2);
        const env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'RESETME';
        const { Configurator } = require(pathMain);
        const path = PATH.join(pathCases, '03');
        const settings = { ...settingsValid, path };
        try {
            Configurator(settings);
        } catch (error) {
            const base = `${settings.name}-${process.env.NODE_ENV}`;
            expect(error.name).toBe(FileError.name);
            expect(error.message).toBe(Replacer(
                FileError.message,
                [base, PATH.join(path, base + settings.ext)],
            ));
        }
        process.env.NODE_ENV = env;
        jest.resetModules();
    });

    test('should throw when environment file is not valid', () => {
        expect.assertions(2);
        const env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'RESETME';
        const { Configurator } = require(pathMain);
        const path = PATH.join(pathCases, '04');
        const settings = { ...settingsValid, path };
        try {
            Configurator(settings);
        } catch (error) {
            const base = `${settings.name}-${process.env.NODE_ENV}`;
            expect(error.name).toBe(ParseError.name);
            expect(error.message).toBe(Replacer(
                ParseError.message,
                [base, 'Unexpected end of JSON input'],
            ));
        } finally {
            process.env.NODE_ENV = env;
            jest.resetModules();
        }
    });

    test('should resolve the example', () => {
        const env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'RESETME';
        const { Configurator } = require(pathMain);
        const path = PATH.join(pathCases, 'valid');
        const config = Configurator({ ...settingsValid, path });
        jest.resetModules();
        process.env.NODE_ENV = env;
        expect(config).toEqual({
            a: {
                a1: 'one', a2: 'two', aa: 'onetwo', ab: 'onetwo-b',
            },
            b: true,
        });
    });

    test('should have available the Path and Env properties', () => {
        const path = PATH.join(pathCases, '05');
        const env = process.env.NODE_ENV;
        process.env.npm_package_directories_DELME = path;
        process.env.NODE_ENV = 'RESETME';
        const { Configurator } = require(pathMain);
        const config = Configurator({ ...settingsValid, path });
        jest.resetModules();
        delete process.env.npm_package_directories_DELME;
        process.env.NODE_ENV = env;
        expect(config).toEqual({ path, env: 'RESETME' });
    });

});

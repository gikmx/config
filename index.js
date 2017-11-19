const FS   = require('fs');
const PATH = require('path');

const $         = require('xstream').default;
const Flatten   = require('xstream/extra/flattenSequentially').default;
const Extendify = require('extendify');

/**
 * Extendify
 *
 * Use this library to extend the properties sent by the configuration.
 * The arrays:'concat' property specifies the algorithm to be used for arrays.
 */
const extend = Extendify({ arrays: 'concat' });

/**
 * Config
 *
 * A simple object extender, usually used to create configuration files.
 *
 * @property {string} root - The path where config files are located.
 * @property {object} conf - The initial configuration object (optional).
 *
 * @return {xstream} A stream (xstream's) containing the resulting configuration.
 *
 * @author Héctor Menéndez <etor@gik.mx>
 */
module.exports = function Config(root, conf = {}){
    // root must be a string
    if (typeof root != 'string')
        throw new TypeError(`Expecting a root string, got ${typeof root}`);
    // conf must be an object
    // TODO: Type validation should be better
    if (!(typeof conf === 'object' && !Array.isArray(conf)))
        throw new TypeError(`Expecting a configuration object, got: ${typeof conf}`);
    // Determine the extame of files to load.
    // TODO: The extension should  be sent by the user.
    const ext = PATH.extname(__filename);
    const env = !process.env.NODE_ENV? 'development' : process.env.NODE_ENV.toLowerCase();
    // Return the stream
    return toStream(FS.stat, root)
        // Determines if the directory exists, and returns its contents
        .map(stat => {
            if (!stat.isDirectory()) throw `Invalid root directory, got ${root}`;
            return toStream(FS.readdir, root);
        })
        .compose(Flatten)
        // Convert the directory listing to an individual stream
        .map(nodes => $.fromArray(nodes))
        .compose(Flatten)
        // gets each listed node stat to determine if its a file
        // (ignoring those files that are environment-specific)
        .map(node => {
            const path = PATH.join(root, node);
            return toStream(FS.stat, path)
                .map(stat => { stat.path = path; return stat; });
        })
        .compose(Flatten)
        .filter(node =>
            node.isFile() && // is a file (duh)
            PATH.extname(node.path) === ext && // is the correct extension
            (PATH.basename(node.path).match(/\./g) || []).length == 1 // only has one dot
        )
        .map(node => node.path)
        // gets the name and requires the file as an object using the basename as an id.
        .map(path => {
            const base = PATH.basename(path, ext);
            const spec = PATH.join(PATH.dirname(path), [base, env].join('.') + ext);
            let mod    = require(path);
            // The module needs to be a function, but the user can be using imports
            // so, if that's the case, then use the default property.
            if (typeof mod=='object' && typeof mod.default=='function') mod = mod.default;
            if (typeof mod != 'function'){
                const type = typeof mod;
                const msg = `Invalid config '${path}', expecting a function, got:${type}`;
                throw new TypeError(msg);
            }
            // Determine if an environment-specific file exists, and if it does
            // extend the base module with it.
            return toStream(FS.access, spec)
                // FS.access throws error, catch it and replace it with "true"
                .replaceError( () => $.of(true))
                .map(notfound => ({ base, mod, spec: notfound? null : require(spec) }));
        })
        .compose(Flatten)
        // Create a single object containing all properties (files) found.
        .fold((acc, cur) => {
            // get the current module by passing the currently accumulated conf.
            acc[cur.base] = cur.mod(acc);
            // if specific environment file exists, pass it the current module and
            // set the resulting extension as the new module.
            if (cur.spec) acc[cur.base] = extend(acc[cur.base], cur.spec(acc));
            return acc;
        }, conf)
        .last();
};

/**
 * toStream
 *
 * A shorthand to convert a node-callback pattern to an xstream stream.
 *
 * @property {function} fn - The node-styled function to call.
 * @property {mixed} - The arguments to send to the function when called.
 *
 * @return {stream} - An xstream stream.
 */
function toStream (fn, ...args) {
    return $.create({
        start: listener => {
            args.push(function(...result){
                const err = result.shift();
                if (err) listener.error(err);
                else {
                    listener.next(...result);
                    listener.complete();
                }
            });
            return fn(...args);
        },
        stop: function(){}
    });
}

var npm = require('npm');
var npmi = require('npmi');
var semver = require('semver');
var Immutable = require('immutable');

var Promise = require('../utils/promise');
var Plugin = require('../models/plugin');
var gitbook = require('../gitbook');

var npmIsReady;

/**
    Initialize and prepare NPM

    @return {Promise}
*/
function initNPM() {
    if (npmIsReady) return npmIsReady;

    npmIsReady = Promise.nfcall(npm.load, {
        silent: true,
        loglevel: 'silent'
    });

    return npmIsReady;
}



/**
    Resolve a plugin to a version

    @param {Plugin}
    @return {Promise<String>}
*/
function resolveVersion(plugin) {
    var npmId = Plugin.nameToNpmID(plugin.getName());
    var requiredVersion = plugin.getVersion();

    return initNPM()
    .then(function() {
        return Promise.nfcall(npm.commands.view, [npmId + '@' + requiredVersion, 'engines'], true);
    })
    .then(function(versions) {
        versions = Immutable.Map(versions).entries().toList();

        var result = versions
            .map(function(entry) {
                return {
                    version: entry[0],
                    gitbook: (entry[1].engines || {}).gitbook
                };
            })
            .filter(function(v) {
                return v.gitbook && gitbook.satisfies(v.gitbook);
            })
            .sort(function(v1, v2) {
                return semver.lt(v1.version, v2.version)? 1 : -1;
            })
            .get(0);

        if (!result) {
            return undefined;
        } else {
            return result.get('version');
        }
    });
}


/**
    Install a plugin for a book

    @param {Book}
    @param {Plugin}
    @return {Promise}
*/
function installPlugin(book, plugin) {
    var logger = book.getLogger();

    var installFolder = book.getRoot();
    var name = plugin.getName();
    var requirement = plugin.getVersion();

    logger.info.ln('installing plugin', name);

    // Find a version to install
    return resolveVersion(plugin)
    .then(function(version) {
        if (!version) {
            throw new Error('Found no satisfactory version for plugin "' + name + '" with requirement "' + requirement + '"');
        }

        logger.info.ln('install plugin "' + plugin +'" from NPM with version', requirement);
        return Promise.nfcall(npmi, {
            'name': plugin.getNpmID(),
            'version': version,
            'path': installFolder,
            'npmLoad': {
                'loglevel': 'silent',
                'loaded': true,
                'prefix': installFolder
            }
        });
    })
    .then(function() {
        logger.info.ok('plugin "' + plugin + '" installed with success');
    });
}


/**
    Install plugin requirements for a book

    @param {Book}
    @param {OrderedMap<String:Plugin>}
    @return {Promise}
*/
function installPlugins(book, plugins) {
    return Promise.forEach(plugins, function(plugin) {
        return installPlugin(book, plugin);
    });
}

module.exports = installPlugins;
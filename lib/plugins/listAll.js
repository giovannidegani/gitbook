var is = require('is');
var Immutable = require('immutable');
var Plugin = require('../models/plugin');

var DEFAULT_PLUGINS = require('../constants/defaultPlugins');

/**
    List all plugins for a book

    @param {List<Plugin|String>}
    @return {OrderedMap<Plugin>}
*/
function listAll(plugins) {
    if (is.string(plugins)) {
        plugins = new Immutable.List(plugins.split(','));
    }

    // Convert to an ordered map
    plugins = plugins.map(function(plugin) {
        if (is.string(plugin)) {
            plugin = Plugin.createFromString(plugin);
        } else {
            plugin = new Plugin(plugin);
        }

        return [plugin.getName(), plugin];
    });
    plugins = Immutable.OrderedMap(plugins);

    // Extract list of plugins to disable (starting with -)
    var toRemove = plugins.toList()
        .filter(function(plugin) {
            return plugin.getName()[0] == '-';
        })
        .map(function(plugin) {
            return plugin.slice(1);
        });

    // Append default plugins
    DEFAULT_PLUGINS.forEach(function(pluginName) {
        if (plugins.has(pluginName)) return;

        plugins = plugins.set(pluginName, new Plugin({
            name: pluginName
        }));
    });

    // Remove plugins
    plugins = plugins.filterNot(function(plugin) {
        return toRemove.includes(plugin.getName());
    });

    return plugins;
}

module.exports = listAll;
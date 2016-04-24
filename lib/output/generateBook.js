var Output = require('../models/output');
var Config = require('../models/config');
var Promise = require('../utils/promise');

var callHook = require('./callHook');
var preparePlugins = require('./preparePlugins');
var preparePages = require('./preparePages');
var prepareAssets = require('./prepareAssets');
var generateAssets = require('./generateAssets');
var generatePages = require('./generatePages');

/**
    Generate a book using a generator.

    The overall process is:
        1. List and load plugins for this book
        2. Call hook "config"
        3. Call hook "init"
        4. Initialize generator
        5. List all assets and pages
        6. Copy all assets to output
        7. Generate all pages
        8. Call hook "finish:before"
        9. Finish generation
        10. Call hook "finish"


    @param {Generator} generator
    @param {Book} book
    @param {Object} options

    @return {Promise<Output>}
*/
function generateBook(generator, book, options) {
    options = generator.Options(options);

    return Promise(
        Output.createForBook(book, options)
    )
    .then(preparePlugins)
    .then(preparePages)
    .then(prepareAssets)

    .then(
        callHook.bind(null,
            'config',
            function(output) {
                var book = output.getBook();
                var config = book.getConfig();
                var values = config.getValues();

                return values.toJS();
            },
            function(output, result) {
                var book = output.getBook();
                var config = book.getConfig();

                config = Config.updateValues(config, result);
                book = book.set('config', config);
                return output.set('book', book);
            }
        )
    )

    .then(callHook.bind(null, 'init'))

    .then(function(output) {
        if (!generator.onInit) {
            return output;
        }

        return generator.onInit(output);
    })

    .then(generateAssets.bind(null, generator))
    .then(generatePages.bind(null, generator))

    .then(callHook.bind(null, 'finish:before'))

    .then(function(output) {
        if (!generator.onFinish) {
            return output;
        }

        return generator.onFinish(output);
    });
}

module.exports = generateBook;
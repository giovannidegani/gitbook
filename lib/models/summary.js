var Immutable = require('immutable');

var File = require('./file');
var SummaryPart = require('./summaryPart');
var SummaryArticle = require('./summaryArticle');

var Summary = Immutable.Record({
    file:       File(),
    parts:      Immutable.List()
});

Summary.prototype.getFile = function() {
    return this.get('file');
};

Summary.prototype.getParts = function() {
    return this.get('parts');
};

/**
    Return a part/article by its level

    @param {String} level
    @return {Part|Article}
*/
Summary.prototype.getByLevel = function(level) {
    return SummaryArticle.getByLevel(this, level, 'getParts');
};


/**
    Create a new summary for a list of parts

    @param {Lust|Array} parts
    @return {Summary}
*/
Summary.createFromParts = function createFromParts(file, parts) {
    parts = parts.map(function(part, i) {
        if (part instanceof SummaryPart) {
            return part;
        }

        return SummaryPart.create(part, i);
    });

    return new Summary({
        file: file,
        parts: new Immutable.List(parts)
    });
};

module.exports = Summary;
const stream = require('./stream');

function color() {}

const rgba = color.rgba = function () {
    var args = Array.prototype.slice.call(arguments).map(enforceStream);
    return stream.combine(args[0], args[1], args[2], args[3], rgbaString);
}

function enforceStream(val) {
    return stream.isStream(val) ? val : stream(val);
}

function rgbaString(r, g, b, a) {
    return 'rgba(' + [r, g, b, a].join(',') + ')';
}

module.exports = color;

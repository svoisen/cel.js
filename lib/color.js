const stream = require('./stream');
const util = require('./util');

function color() {}

const rgba = color.rgba = function () {
    var args = util.copyToArray(arguments).map(stream.coerce);
    return stream.combine(args[0], args[1], args[2], args[3], rgbaString);
}

function rgbaString(r, g, b, a) {
    return 'rgba(' + [r, g, b, a].join(',') + ')';
}

module.exports = color;

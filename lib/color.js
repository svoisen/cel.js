const observable = require('./observable');
const util = require('./util');

/**
 * Create a property from red, green, blue and alpha inputs.
 * @param {stream} red
 * @param {stream} green
 * @param {stream} blue
 * @param {stream} alpha
 * @returns {property}
 */
function rgba() {
    return observable.combine(arguments[0], arguments[1], arguments[2], arguments[3], _rgbaString).toProperty();
}

function _rgbaString(r, g, b, a) {
    return 'rgba(' + [r, g, b, a].join(',') + ')';
}

exports.rgba = rgba;

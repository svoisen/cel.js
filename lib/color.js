const observable = require('./observable');
const util = require('./util');

function rgba() {
    return observable.combine(arguments[0], arguments[1], arguments[2], arguments[3], _rgbaString).toProperty();
}

function _rgbaString(r, g, b, a) {
    return 'rgba(' + [r, g, b, a].join(',') + ')';
}

exports.rgba = rgba;

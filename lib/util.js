function isFunction(fn) {
    return typeof fn === 'function';
}

function isUndefined(val) {
    return typeof val === 'undefined';
}

function copyToArray(val) {
    return Array.prototype.slice.call(val);
}

exports.isFunction = isFunction;
exports.isUndefined = isUndefined;
exports.copyToArray = copyToArray;

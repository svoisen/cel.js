const observable = require('./observable');

function sin(x) {
    return observable.map(observable.toProperty(x), x => Math.sin(x));
}

exports.sin = sin;
'use strict';

const curry = require('curry');

/**
 * Create a stream.
 * @param initialValue
 */
function stream(initialValue) {
    var s = createStream();
    s(initialValue);

    return s;
}

stream.isStream = function(s) {
    return typeof s === 'function' && s.isStream;
};

stream.observe = function(s, callback) {
    if (s && callback) {
        s.observers.push(callback);
    }

    return s;
};

stream.merge = function() {
    return createStream(Array.prototype.slice.call(arguments));
};

stream.map = function(s, fn) {
    return createStream([s], fn);
};

stream.combine = function() {
    var args = Array.prototype.slice.call(arguments),
        fn = args.splice(args.length - 1, 1);

    return createStream(args, fn);
};

function createStream(tributaries, mapFn) {
    function s(value) {
        if (arguments.length === 0) {
            return s.currentValue;
        }

        pushDownStream(s, value);
        return s;
    }

    s.isStream = true;
    s.currentValue = undefined;
    s.mapFn = mapFn;
    s.values = [];
    s.observers = [];
    s.tributaries = tributaries || [];
    s.tributaries.forEach((tributary) => {
        stream.observe(tributary, curry(processTributary)(s));
    });

    return s;
}

function processTributary(s, val, tributary) {
    s(val);
}

function pushDownStream(s, value) {
    value = s.mapFn ? s.mapFn(value) : value;
    if (typeof value === 'undefined') {
        return;
    }

    s.values.push(value);
    flushStream(s);
}

function flushStream(s) {
    s.values.forEach((value) => {
        s.currentValue = value;
        notifyObservers(s);
    });

    s.values = [];
}

function notifyObservers(s) {
    s.observers.forEach((observer) => {
        observer(s(), s)
    });
}

module.exports = stream;

'use strict';

const R = require('ramda');

/**
 * Create an observable event stream.
 * @param {*} initialValue The initial value for the stream.
 * @return {function} An observable event stream.
 */
function stream(initialValue) {
    var s = createStream();
    s(initialValue);

    return s;
}

/**
 * Returns true if the given stream is an empty stream.
 * @param {function} s The stream to check for the empty condition.
 * @return {boolean} True if the stream `s` is empty, false otherwise.
 */
const isEmpty = stream.isEmpty = function (s) {
    return isStream(s) && isUndefined(s());
};

const isStream = stream.isStream = function (s) {
    return isFunction(s) && s.isStream;
};

const observe = stream.observe = function (s, callback) {
    if (isStream(s) && isFunction(callback)) {
        s.observers.push(callback);
    }

    return s;
};

const merge = stream.merge = function () {
    return createStream(Array.prototype.slice.call(arguments));
};

const map = stream.map = function (s, fn) {
    return createStream([s], fn);
};

const combine = stream.combine = function () {
    var args = Array.prototype.slice.call(arguments),
        fn = args.splice(args.length - 1, 1)[0];

    return createStream(args, fn);
};

function createStream(tributaries, mapFn) {
    function s(val) {
        if (!arguments.length) {
            return s.currentValue;
        }

        pushDownstream(s, val);
        return s;
    }

    s.isStream = true;
    s.currentValue = undefined;
    s.mapFn = isFunction(mapFn) ? R.curry(mapFn) : undefined;
    s.values = [];
    s.observers = [];

    var process = R.curry(processTributary)(s);
    s.tributaries = tributaries || [];
    s.tributaries.forEach((t) => {
        observe(t, process);
        process(t(), t);
    });

    return s;
}

function processTributary(s, val, tributary) {
    if (!isFunction(s.mapFn)) {
        pushDownstream(s, val);
    } else if (tributariesValid(s)) {
        val = R.reduce((fn, t) => fn(t()), s.mapFn, s.tributaries);
        pushDownstream(s, val);
    }

    return s;
}

function tributariesValid(s) {
    return R.all(t => !isEmpty(t), s.tributaries);
}

function pushDownstream(s, val) {
    if (isUndefined(val)) {
        return s;
    }

    s.values.push(val);
    flushStream(s);
    return s;
}

function flushStream(s) {
    s.values.forEach((val) => {
        s.currentValue = val;
        notifyObservers(s);
    });

    s.values = [];
    return s;
}

function notifyObservers(s) {
    s.observers.forEach(o => o(s(), s));
    return s;
}

function isFunction(fn) {
    return typeof fn === 'function';
}

function isUndefined(val) {
    return typeof val === 'undefined';
}

module.exports = stream;

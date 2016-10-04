'use strict';

const all = require('ramda/src/all');
const curry = require('ramda/src/curry');
const curryN = require('ramda/src/curryN');
const reduce = require('ramda/src/reduce');
const _ = require('ramda/src/__');

const util = require('./util');

/**
 * Creates an observable event stream.
 * @param {*} initialValue The initial value for the stream.
 * @return {function} An observable event stream.
 */
function stream(initialValue) {
    var s = createStream();
    s(initialValue);

    return s;
}

/**
 * Returns true if the given stream is an empty stream. An empty stream
 * is a stream that has a current value of undefined.
 * @param {function} s The stream to check for the empty condition.
 * @return {boolean} True if the stream `s` is empty, false otherwise.
 */
const isEmpty = stream.isEmpty = function (s) {
    return isStream(s) && util.isUndefined(s());
};

/**
 * Returns true if the given parameter `s` is an event stream.
 * @param {*} s The parameter to check for membership of the event stream type.
 * @return {boolean} True if the given parameter is a stream, false otherwise.
 */
const isStream = stream.isStream = curryN(1, function (s) {
    return util.isFunction(s) && s.isStream;
});

const terminate = stream.terminate = curryN(1, function (s) {

});

/**
 * Converts the given parameter `s` to a stream if it is not already a stream.
 * @param {*} s The object to convert to a stream.
 * @return {stream}
 */
const coerce = stream.coerce = curryN(1, function (s) {
    return isStream(s) ? s : stream(s);
});

const observe = stream.observe = curryN(2, function (s, callback) {
    if (isStream(s) && util.isFunction(callback)) {
        s.observers.push(callback);
    }

    return s;
});

const merge = stream.merge = curry(function () {
    return createStream(util.copyToArray(arguments));
});

const map = stream.map = curryN(2, function (s, fn) {
    return createStream([s], fn);
});

const combine = stream.combine = curry(function () {
    var args = util.copyToArray(arguments),
        fn = args.splice(args.length - 1, 1)[0];

    return createStream(args, fn);
});

const sample = stream.sample = curryN(2, function (s, trigger) {
    return combine(trigger, _ => s());
});

const fromArray = stream.fromArray = function (array) {
    var s = createStream([], undefined, true);
    array.forEach(val => s(val));

    return s;
};

const fromInterval = stream.fromInterval = function (interval) {
    var s = stream(),
        id = setInterval(() => s(id), interval);

    return s;
};

const fromAnimationFrame = stream.fromAnimationFrame = function () {
    var s = stream();

    function frameHandler(timestamp) {
        pushDownstream(s, timestamp);
        requestAnimationFrame(frameHandler);
    }

    requestAnimationFrame(frameHandler);
    return s;
};

function createStream(tributaries, mapFn, actsAsQueue) {
    function s(val) {
        if (!arguments.length) {
            if (s.values.length) {
                s.currentValue = s.values.shift();
            }
            
            return s.currentValue;
        }

        pushDownstream(s, val);
        return s;
    }

    s.isStream = true;
    s.actsAsQueue = actsAsQueue || false;
    s.currentValue = undefined;
    s.mapFn = util.isFunction(mapFn) ? curry(mapFn) : undefined;
    s.values = [];
    s.observers = [];

    var process = curry(processTributary)(s);
    s.tributaries = tributaries || [];
    s.tributaries.forEach((t) => {
        observe(t, process);
        process(t(), t);
    });

    return s;
}

function processTributary(s, val, tributary) {
    if (!util.isFunction(s.mapFn)) {
        pushDownstream(s, val);
    } else if (tributariesValid(s)) {
        val = reduce((fn, t) => fn(t()), s.mapFn, s.tributaries);
        pushDownstream(s, val);
    }

    return s;
}

function tributariesValid(s) {
    return all(t => !isEmpty(t), s.tributaries);
}

/**
 * @private
 * @param s
 * @param val
 * @returns {*}
 */
function pushDownstream(s, val) {
    if (util.isUndefined(val)) {
        return s;
    }

    s.values.push(val);
    flushStream(s);
    return s;
}

/**
 * @private
 * @param s
 * @returns {*}
 */
function flushStream(s) {
    if (s.actsAsQueue) {
        return s;
    }
    
    if (!s.observers.length && !s.actsAsQueue) {
        s.currentValue = s.values[s.values.length - 1];
        s.values = [];
        return s;
    } 
    
    while (s.values.length) {
        notifyObservers(s);
    }

    return s;
}

/**
 * @private
 * @param s
 * @returns {*}
 */
function notifyObservers(s) {
    s.observers.forEach(o => o(s(), s));
    return s;
}

module.exports = stream;

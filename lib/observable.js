'use strict';

const all = require('ramda/src/all');
const any = require('ramda/src/any');
const curry = require('ramda/src/curry');
const curryN = require('ramda/src/curryN');
const reduce = require('ramda/src/reduce');
const _ = require('ramda/src/__');

const util = require('./util');

/**
 * @private
 * Describes the methods with which observables may treat their
 * "current value" property.
 */
const VALUE_POLICY = {
    ALWAYS_EMPTY: 'ALWAYS_EMPTY',
    READ_ONCE: 'READ_ONCE',
    READ_MULTIPLE: 'READ_MULTIPLE' 
};

/**
 * Creates a property, a type of observable that retains a value.
 * @param {*} initialValue The initial value for the property.
 * @returns {function} A new property.
 */
function property(initialValue) {
    var property = _createObservable(VALUE_POLICY.READ_MULTIPLE);
    property(initialValue);

    return property;
}

function ephemeralProperty(initialValue) {
    var property = _createObservable(VALUE_POLICY.READ_ONCE);
    property(initialValue);

    return property;
}

/**
 * Creates an observable event stream. 
 * @returns {function} A new event stream.
 */
function stream(initialValue) {
    var stream = _createObservable(VALUE_POLICY.ALWAYS_EMPTY);
    stream(initialValue);

    return stream;
}

/**
 * Returns true if the given observable is an empty stream. An empty stream
 * is a stream that has a current value of undefined. By definition, properties
 * cannot be empty.
 * @param {function} s The stream to check for the empty condition.
 * @return {boolean} True if the stream `s` is empty, false otherwise.
 */
function isEmpty(observable) {
    if (!isObservable(observable)) {
        return false;
    }

    return isStream(observable) || util.isUndefined(observable());
}

/**
 * Returns true if the given object is an observable (either stream or property).
 * @param {*} maybeObservable The object to test.
 * @return {boolean} True if the object is an observable.
 */
function isObservable(maybeObservable) {
    return util.isFunction(maybeObservable) && maybeObservable._isObservable;
}

/**
 * Returns true if the given object is a stream.
 * @param {*} maybeStream The object to test.
 * @return {boolean} True if the object is a stream.
 */
function isStream(maybeStream) {
    return isObservable(maybeStream) && maybeStream._valuePolicy === VALUE_POLICY.ALWAYS_EMPTY;
}

function isEphemeralProperty(maybeProperty) {
    return isObservable(maybeProperty) && maybeProperty._valuePolicy === VALUE_POLICY.READ_ONCE;
}

function isProperty(maybeProperty) {
    return isObservable(maybeProperty) && maybeProperty._valuePolicy === VALUE_POLICY.READ_MULTIPLE;
}

const observe = curryN(2, function (observable, callback) {
    return _observe(observable, callback, true);
});

const merge = curryN(2, function(observable1, observable2) {
    return _createObservable(VALUE_POLICY.ALWAYS_EMPTY, false, [observable1, observable2]);
});

function mergeAll() {
    var tributaries = Array.isArray(arguments[0]) ? arguments[0] : util.copyToArray(arguments);
    return _createObservable(VALUE_POLICY.ALWAYS_EMPTY, false, tributaries);
}

const map = curryN(2, function (observable, fn) {
    return _createObservable(VALUE_POLICY.ALWAYS_EMPTY, observable._queuesValues, [observable], fn);
});

function combine() {
    var args = util.copyToArray(arguments),
        fn = args.splice(args.length - 1, 1)[0],
        args = args.map(arg => toProperty(arg));

    return _createObservable(VALUE_POLICY.READ_MULTIPLE, false, args, fn);
}

const sample = curryN(2, function (property, interval) {
    var timedStream = fromInterval(interval),
        stream = combine(timedStream, () => property());

    stream._observerAdded = function () {
        stream._tributaries.forEach((t) => t._observerAdded());
        property._observerAdded();
        stream.clearInterval = timedStream.clearInterval;
    };

    return stream;
});

const sampleBy = curryN(2, function (property, trigger) {
    var stream = combine(trigger, () => property());
    stream._observerAdded = function () {
        stream._tributaries.forEach((t) => t._observerAdded());
        property._observerAdded();
    };

    return stream;
});

function toProperty(val) {
    if (isObservable(val)) {
        if (isProperty(val)) {
            return val;
        }

        return _createObservable(VALUE_POLICY.READ_MULTIPLE, val._queuesValues, [val]);
    }

    return property(val);
}

function fromArray(array) {
    var stream = _createObservable(VALUE_POLICY.ALWAYS_EMPTY, true);
    array.forEach(val => stream(val));

    return stream;
}

function fromInterval(interval) {
    var stream = _createObservable(VALUE_POLICY.ALWAYS_EMPTY, false);
    stream._observerAdded = function () {
        var id = setInterval(() => stream(id), interval);
        stream._intervalId = id;
        stream.clearInterval = function () {
            clearInterval(stream._intervalId);
            delete stream._intervalId;
        };
        delete stream._observerAdded;
    };
    
    return stream;
}

function fromAnimationFrame() {
    var stream = _createObservable(VALUE_POLICY.ALWAYS_EMPTY, false),
        frameHandler = function (timestamp) {
            stream(timestamp);
            requestAnimationFrame(frameHandler);
        };

    requestAnimationFrame(frameHandler);
    return stream;
};

/**
 * @private
 * @param {string} valuePolicy
 */
function _createObservable(valuePolicy, queuesValues, tributaries, transformFn) {
    function observable(val)  {
        if (!arguments.length) {
            var retVal;

            if (observable._values.length) {
                retVal = observable._currentValue = observable._values.shift();
            } else if (observable._valuePolicy === VALUE_POLICY.ALWAYS_EMPTY) {
                retVal = observable._currentValue = undefined;
            } else if (observable._valuePolicy === VALUE_POLICY.READ_MULTIPLE) {
                retVal = observable._currentValue;
            } else if (observable._valuePolicy === VALUE_POLICY.READ_ONCE) {
                retVal = observable._currentValue;
                observable._currentValue = undefined;
            }

            return retVal;
        }
        
        _pushValue(observable, val);
        return observable;
    }
    
    observable._isObservable = true;
    observable._valuePolicy = valuePolicy || VALUE_POLICY.ALWAYS_EMPTY;
    observable._queuesValues = queuesValues || false;
    observable._currentValue = undefined;
    observable._transformFn = util.isFunction(transformFn) ? curry(transformFn) : (val) => val;
    observable._values = [];
    observable._observers = [];
    observable._tributaries = tributaries || [];
    observable._observerAdded = function () {
        observable._tributaries.forEach((t) => t._observerAdded());
    };
    
    var process = curry(_processTributary)(observable);
    observable._tributaries.forEach((t) => {
        _observe(t, process, false);
        process(t(), t);
    });
    
    return _attachMethods(observable);
}

function _observe(observable, callback, notify) {
    if (isObservable(observable) && util.isFunction(callback)) {
        observable._observers.push(callback);
        if (notify && util.isFunction(observable._observerAdded)) {
            observable._observerAdded();
        }
        _flush(observable);
    }

    return observable;
}

function _attachMethods(observable) {
    observable.observe = observe(observable);
    observable.merge = merge(observable);
    observable.map = map(observable);
    observable.sample = sample(observable);
    observable.sampleBy = sampleBy(observable);

    observable.isEmpty = function () {
        return isEmpty(observable);
    };

    observable.toProperty = function () {
        return toProperty(observable);
    };

    return observable;
}

function _processTributary(observable, val, tributary) {
    if (isStream(tributary) && !util.isUndefined(val)) {
        _pushValue(observable, observable._transformFn(val))
    } else if (_allTributariesNonEmpty(observable)) {
        // For properties: Wait until all tributaries have values before 
        // applying the transform function since we must assume that the 
        // function relies on these values
        val = reduce((fn, t) => fn(t()), observable._transformFn, observable._tributaries);
        _pushValue(observable, val);
    }

    return observable;
}

function _allTributariesNonEmpty(observable) {
    return all(t => !isEmpty(t), observable._tributaries);
}

function _pushValue(observable, val) {
    if (util.isUndefined(val)) {
        return observable;
    }
    
    observable._values.push(val);
    _flush(observable);
    
    return observable;
}

function _flush(observable) {
    // Do not flush the observable if it queues values but does not
    // yet have any observers
    if (!observable._observers.length) {
        if (observable._queuesValues) {
            return observable;
        }
        
        if (observable._valuePolicy === VALUE_POLICY.ALWAYS_EMPTY) {
            observable._currentValue = undefined;
        } else {
            observable._currentValue = observable._values[observable._values.length - 1];
        }
    
        observable._values = [];
        return observable;
    }

    while (observable._values.length) {
        observable._currentValue = observable._values.shift();
        observable._observers.forEach(o => o(observable._currentValue, observable));
    }

    return observable;
}

exports.combine = combine;
exports.isEmpty = isEmpty;
exports.isObservable = isObservable;
exports.isProperty = isProperty;
exports.isStream = isStream;
exports.fromArray = fromArray;
exports.fromInterval = fromInterval;
exports.fromAnimationFrame = fromAnimationFrame;
exports.map = map;
exports.mergeAll = mergeAll;
exports.merge = merge;
exports.observe = observe;
exports.property = property;
exports.sample = sample;
exports.sampleBy = sampleBy;
exports.stream = stream;
exports.toProperty = toProperty;
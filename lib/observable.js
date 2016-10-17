'use strict';

const all = require('ramda/src/all');
const curry = require('ramda/src/curry');
const curryN = require('ramda/src/curryN');
const reduce = require('ramda/src/reduce');
const _ = require('ramda/src/__');

const util = require('./util');

/**
 * Creates a property, a type of observable that retains a value.
 * @param {*} initialValue The initial value for the property.
 * @returns {function} A new property.
 */
function property(initialValue) {
    var property = _createObservable(false, false);
    property(initialValue);

    return property;
}

/**
 * Creates an observable event stream. 
 * @returns {function} A new event stream.
 */
function stream() {
    var stream = _createObservable(true, false);

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

function isStream(maybeStream) {
    return isObservable(maybeStream) && maybeStream._allowsEmpty;
}

function isProperty(maybeProperty) {
    return isObservable(maybeProperty) && !maybeProperty._allowsEmpty;
}

const observe = curryN(2, function (observable, callback) {
    if (isObservable(observable) && util.isFunction(callback)) {
        observable._observers.push(callback);
        _flush(observable);
    }

    return observable;
});

const merge = curryN(2, function(observable1, observable2) {
    return _createObservable(true, false, [observable1, observable2]);
});

function mergeAll() {
    var tributaries = Array.isArray(arguments[0]) ? arguments[0] : util.copyToArray(arguments);
    return _createObservable(true, false, tributaries);
}

const map = curryN(2, function (observable, fn) {
    return _createObservable(true, false, [observable], fn);
});

function combine() {
    var args = util.copyToArray(arguments),
        fn = args.splice(args.length - 1, 1)[0],
        args = args.map(arg => toProperty(arg));

    return _createObservable(false, false, args, fn);
}

const sample = curryN(2, function (property, interval) {
    return combine(fromInterval(interval), (id) => {
        return {
            intervalId: id,
            value: property()
        }
    });
});

const sampleBy = curryN(2, function (property, trigger) {
    return combine(trigger, () => property());
});

function toProperty(val) {
    if (isObservable(val)) {
        if (isProperty(val)) {
            return val;
        }

        return _createObservable(false, false, [val]);
    }

    return property(val);
}

function fromArray(array) {
    var stream = _createObservable(true, true);
    array.forEach(val => stream(val));

    return stream;
}

function fromInterval(interval) {
    var stream = _createObservable(true, false),
        id = setInterval(() => stream(id), interval);
    
    return stream;
}

function fromAnimationFrame() {
    var stream = _createObservable(true, false),
        frameHandler = function (timestamp) {
            _pushValue(stream, timestamp);
            requestAnimationFrame(frameHandler);
        };

    requestAnimationFrame(frameHandler);
    return stream;
};

function _createObservable(allowsEmpty, queuesValues, tributaries, transformFn) {
    function observable(val)  {
        if (!arguments.length) {
            if (observable._values.length) {
                observable._currentValue = observable._values.shift();
            } else if (observable._allowsEmpty) {
                observable._currentValue = undefined;
            }
            
            return observable._currentValue;
        }
        
        _pushValue(observable, val);
        return observable;
    }
    
    observable._isObservable = true;
    observable._allowsEmpty = allowsEmpty;
    observable._queuesValues = queuesValues;
    observable._currentValue = undefined;
    observable._transformFn = util.isFunction(transformFn) ? curry(transformFn) : (val) => val;
    observable._values = [];
    observable._observers = [];
    observable._tributaries = tributaries || [];
    
    var process = curry(_processTributary)(observable);
    observable._tributaries.forEach((t) => {
        observe(t, process);
        process(t(), t);
    });
    
    return _attachMethods(observable);
}

function _attachMethods(observable) {
    observable.observe = observe(observable);
    observable.merge = merge(observable);
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
    if (observable._queuesValues && !observable._observers.length) {
        return observable;
    }
    
    if (!observable._queuesValues && !observable._observers.length) {
        if (observable._allowsEmpty) {
            observable._currentValue = undefined;
        } else {
            observable._currentValue = observable._values[observable._values.length - 1];
        }
        
        observable._values = [];
        return observable;
    }

    while (observable._values.length) {
        _notifyObservers(observable);
    }

    return observable;
}

function _notifyObservers(observable) {
    observable._observers.forEach(o => o(observable(), observable));
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
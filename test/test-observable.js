const assert = require('chai').assert;
const replaceRaf = require('raf-stub').replaceRaf;
const sinon = require('sinon');

const observable = require('../lib/observable');
const util = require('../lib/util');

replaceRaf();

describe('observable', function () {
    describe('#stream', function () {
        var stream;

        beforeEach(function () {
            stream = observable.stream();
        });

        it('should return a function that is an observable', function () {
            assert.isTrue(util.isFunction(stream));
            assert.isTrue(observable.isObservable(stream));
        });

        it('should return a stream', function () {
            assert.isTrue(observable.isStream(stream));
        });

        it('should have a default value of undefined', function () {
            assert.equal(typeof stream(), 'undefined');
        });

        it('should not be able to have an initial value', function () {
            var stream = observable.stream(1);
            assert.equal(typeof stream(), 'undefined');
        });
    });

    describe('#property', function () {
        var property;

        beforeEach(function () {
            property = observable.property();
        });

        it('should return a function that is an observable', function () {
            assert.isTrue(util.isFunction(property));
            assert.isTrue(observable.isObservable(property));
        });

        it('should return a property', function () {
            assert.isTrue(observable.isProperty(property));
        });

        it('should have a default value of undefined', function () {
            assert.equal(typeof property(), 'undefined');
        });

        it('should be able to have an initial value', function () {
            var property = observable.property(1);
            assert.equal(property(), 1);
        });

        it('should be able to have a current value', function () {
            property(1);
            assert.equal(property(), 1);
        });
    });

    describe('#observe', function () {
        it('should be a curried function', function () {
            var stream = observable.stream(),
                observe = observable.observe(stream),
                spy = sinon.spy();

            observe(spy);
            stream(1);
            assert.isTrue(spy.calledOnce);
        });

        describe('when observing streams', function () {
            var stream;
            
            beforeEach(function () {
                stream = observable.stream();
            });

            it('should not call the observer for an empty stream', function () {
                var spy = sinon.spy();
                observable.observe(stream, spy),
                assert.isFalse(spy.called);
            });

            it('should call the observer callback for each value', function () {
                var values = [];

                observable.observe(stream, val => values.push(val));

                stream(1)(2)(3);
                assert.sameMembers(values, [1, 2, 3]);
            });

            it('should allow multiple observers', function () {
                var spy1 = sinon.spy(),
                    spy2 = sinon.spy();

                observable.observe(stream, spy1);
                observable.observe(stream, spy2);

                stream(1);
                assert.isTrue(spy1.calledOnce);
                assert.isTrue(spy2.calledOnce);
            });

            it('should return the stream', function () {
                assert.equal(observable.observe(stream, sinon.spy()), stream);
            });

            it('should allow chaining syntax', function () {
                var spy = sinon.spy();
                stream.observe(spy);

                stream(1);
                assert.isTrue(spy.calledOnce);
            });
        });

        describe('when observing properties', function () {
            var property;

            beforeEach(function () {
                property = observable.property();
            });

            it('should not call the observer for an empty property', function () {
                var spy = sinon.spy();
                observable.observe(property, spy);
                assert.isFalse(spy.called);
            });

            it('should return the property', function () {
                assert.equal(observable.observe(property, sinon.spy()), property);
            });

            it('should allow chaining syntax', function () {
                var spy = sinon.spy();
                property.observe(spy);
                property(1);
                assert.isTrue(spy.calledOnce);
            });
        });
    });

    describe('#map', function () {
        it('should be a curried function', function () {
            var stream = observable.stream(),
                map = observable.map(stream),
                spy = sinon.spy();

            map(spy);
            stream(1);
            assert.isTrue(spy.called);
        });

        describe('when mapping streams', function () {
            it('should return a stream', function () {
                var mapped = observable.map(observable.stream(), () => {});
                assert.isTrue(observable.isStream(mapped));
            });

            it('should not apply mapping function on empty stream', function () {
                var spy = sinon.spy();
                observable.map(observable.stream(), spy);
                assert.isFalse(spy.called);
            });

            it('should apply the mapping function on new items in stream', function() {
                var stream = observable.stream(),
                    mapped = observable.map(stream, val => val * val),
                    spy = sinon.spy();

                mapped.observe(spy);
                stream(1);
                assert.isTrue(spy.calledWith(1));
                spy.reset();

                stream(2);
                assert.isTrue(spy.calledWith(4));
            });

            it('should preserve queueing from upstream', function () {
                var stream = observable.fromArray([1, 2, 3]).map(val => val * val);

                assert.equal(stream(), 1);
                assert.equal(stream(), 4);
            });
        });

        describe('when mapping properties', function () {
            it('should return a stream', function () {
                var mapped = observable.map(observable.property(), () => {});
                assert.isTrue(observable.isStream(mapped));
            });

            it('should not apply the mapping function on an empty property', function () {
                var spy = sinon.spy();
                observable.map(observable.property(), spy);
                assert.isFalse(spy.called);
            });
        });
    });

    describe('#merge', function () {

    });

    describe('#mergeAll', function () {

    });

    describe('#isEmpty', function () {
        it('should be empty for streams', function () {
            var stream = observable.stream();
            assert.isTrue(observable.isEmpty(stream));

            stream(1);
            assert.isTrue(observable.isEmpty(stream));
        });

        it('should allow chaining syntax', function () {
            var stream = observable.stream(),
                property = observable.property(1);

            assert.isTrue(stream.isEmpty());
            assert.isFalse(property.isEmpty());
        });

        it('should be empty for empty properties', function () {
            var property = observable.property();
            assert.isTrue(observable.isEmpty(property));
        });

        it('should not be empty for properties with values', function () {
            var property = observable.property(1);
            assert.isFalse(observable.isEmpty(property));
        });

        it('should have no side-effects on queued streams', function () {
            var stream = observable.fromArray([1, 2, 3]);
            observable.isEmpty(stream);

            assert.equal(stream(), 1);
            assert.equal(stream(), 2);
            assert.equal(stream(), 3);
        });
    });

    describe('#fromArray', function () {
        it('should return a stream', function () {
            assert.isTrue(observable.isStream(observable.fromArray([])));
        });

        it('should create a stream that queues values', function () {
            var stream = observable.fromArray([1, 2, 3]);

            assert.equal(stream(), 1);
            assert.equal(stream(), 2);
            assert.equal(stream(), 3);
            assert.isTrue(util.isUndefined(stream()));
        });

        it('should notify first observer for each item in array', function () {
            var stream = observable.fromArray([1, 2, 3]),
                spy = sinon.spy(),
                vals = [];

            stream.observe(val => vals.push(val));
            assert.sameMembers(vals, [1, 2, 3]);

            stream.observe(spy);
            assert.isFalse(spy.called);
        });
    });

    describe('#fromInterval', function () {
        it('should not start until there is at least one observer', function (done) {
            var stream = observable.fromInterval(50);
            assert.isTrue(util.isUndefined(stream._intervalId));
            assert.isFalse(util.isFunction(stream.clearInterval));

            stream.observe((id) => {
                assert.isFalse(util.isUndefined(stream._intervalId));
                assert.isTrue(util.isFunction(stream.clearInterval));
                stream.clearInterval();
                done();
            });
        });

        it('should push the interval id on the stream', function (done) {
            var stream = observable.fromInterval(50);
            
            observable.observe(stream, (id) => {
                assert.ok(id);
                clearInterval(id);
                done();
            });
        });

        it('should push updates on correct interval', function (done) {
            var stream = observable.fromInterval(50),
                timestamp = Date.now();
 
            observable.observe(stream, (id) => {
                clearInterval(id);
                var delay = Date.now() - timestamp;
                if (delay >= 45 && delay <= 55) {
                    done();
                } else {
                    done("Incorrect interval");
                }
            });
        });

        it('should push updates repeatedly', function (done) {
            var stream = observable.fromInterval(50),
                count = 0;
                
            observable.observe(stream, (id) => {
                if (++count > 2) {
                    clearInterval(id);
                    done();
                }
            });
        });
    });

    describe('#fromAnimationFrame', function () {
        var stream;
        
        beforeEach(function () {
            stream = observable.fromAnimationFrame();
        })

        it('should return a stream', function () {
            assert.isTrue(observable.isStream(stream));
        });

        it('should push updates on every frame', function () {
            var count = 0;

            stream.observe(() => count++);
            requestAnimationFrame.step();
            requestAnimationFrame.step();

            assert.equal(count, 2);
        });

        it('should include the timestamp in the observable data', function () {
            var timestamp;
            
            stream.observe(t => timestamp = t);
            requestAnimationFrame.step();
            
            assert.ok(timestamp);
            assert.isTrue(!isNaN(timestamp));
        });
    });

    describe('#combine', function () {
        it('should combine streams into a single property by converting them to properties', function () {
            var s1 = observable.stream(),
                s2 = observable.stream(),
                combined = observable.combine(s1, s2, (val1, val2) => val1 + val2),
                vals = [];

            assert.isTrue(observable.isProperty(combined));
            assert.isTrue(observable.isEmpty(combined));

            combined.observe(val => vals.push(val));
            s1(1)
            s2(2);
            assert.sameMembers(vals, [3]);
        });

        it('should combine properties into a single property with map function', function () {
            var p1 = observable.property(),
                p2 = observable.property(),
                combined = observable.combine(p1, p2, (val1, val2) => val1 + val2),
                vals = [];

            assert.isTrue(observable.isProperty(combined));
            assert.isTrue(observable.isEmpty(combined));

            combined.observe(val => vals.push(val));
            p1(1)
            p2(2);
            assert.sameMembers(vals, [3]);
        });

        it('should not queue items even if a tributary queues items', function () {
            var s1 = observable.fromArray([1, 2, 3]),
                s2 = observable.stream(),
                combined = observable.combine(s1, s2, (val1, val2) => val1 + val2),
                vals = [];

            s2(1)(2);
            combined.observe(val => vals.push(val));
            s2(3);
            assert.sameMembers(vals, [6]);
        });
    });

    describe('#sample', function () {
        it('should return a property', function () {
            var property = observable.property(),
                sampled = observable.sample(property, 50);

            assert.isTrue(observable.isProperty(sampled));
        });

        it('should not sample until it has an observer', function (done) {
            var property = observable.fromArray([1, 2, 3]),
                sampled = observable.sample(property, 10);

            setTimeout(function () {
                assert.isTrue(util.isUndefined(sampled()));
                assert.equal(property(), 1);
                assert.equal(property(), 2);
                assert.equal(property(), 3);
                done();
            }, 50);
        });
        
        it('should sample the property at regular intervals', function (done) {
            var property = observable.property(1),
                sampled = observable.sample(property, 50),
                timestamp = Date.now();

            sampled.observe(val => {
                assert.isTrue(util.isFunction(sampled.clearInterval));
                sampled.clearInterval();
                var delay = Date.now() - timestamp;
                if (delay >= 45 && delay <= 55) {
                    done();
                } else {
                    done('Incorrect interval');
                }
            })
        });
    });

    describe('#sampleBy', function () {
        it('should sample the property on trigger events', function () {
            var p = observable.property(1),
                s = observable.stream(),
                sampled = observable.sampleBy(p, s),
                vals = [];

            sampled.observe(val => vals.push(val));
            assert.equal(vals.length, 0);
            
            s('foo');
            s('foo');
            
            assert.equal(vals.length, 2);
            assert.sameMembers(vals, [1, 1]);
        });
    });

    describe('#toProperty', function () {
        it('should do nothing if passed a property', function () {
            var property = observable.property();

            assert.equal(observable.toProperty(property), property);
        });

        it('should convert non-observables to properties', function () {
            var property = observable.toProperty(1);

            assert.isTrue(observable.isProperty(property));
            assert.equal(property(), 1);

            property = observable.toProperty('foo');
            assert.isTrue(observable.isProperty(property));
            assert.equal(property(), 'foo');
        });

        it('should convert streams to properties', function () {
            var stream = observable.stream(),
                property = observable.toProperty(stream);

            assert.isTrue(observable.isEmpty(property));
            stream(1);
            assert.equal(property(), 1);
        });
    });
});
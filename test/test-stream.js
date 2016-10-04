const assert = require('chai').assert;
const replaceRaf = require('raf-stub').replaceRaf;
const sinon = require('sinon');

const stream = require('../lib/stream');

replaceRaf();

describe('stream', function () {
    describe('initialization', function () {
        it('should have a default value of undefined', function () {
            var s = stream();
            assert.notOk(s());
        });

        it('should be able to have an initial value', function () {
            var s = stream(1);
            assert.equal(s(), 1);
        });
    });

    describe('#isStream', function () {
        it('should be false for non-streams', function () {
            assert.isFalse(stream.isStream(null));
            assert.isFalse(stream.isStream(1));
            assert.isFalse(stream.isStream("abc"));
        });

        it('should be true for streams', function () {
            assert.isTrue(stream.isStream(stream()));
        });
    });

    describe('when pushing values', function () {
        it('should change the current value', function () {
            var s = stream();
            s(1);
            assert.equal(s(), 1);

            s(2);
            assert.equal(s(), 2);
        });

        it('should be able to chain values', function () {
            var s = stream();
            s(1)(2)(3);
            assert.equal(s(), 3);
        });
    });

    describe('when getting current value', function () {
        it('should have a value', function () {
            var s = stream(1);
            assert.equal(s(), 1);

            s(2);
            assert.equal(s(), 2);
        });
    });

    describe('when observing a stream (#observe)', function () {
        it('should be a curried function', function () {
            var s = stream(),
                observe = stream.observe(s),
                spy = sinon.spy();
                
            observe(spy);
            s(1);
            assert.isTrue(spy.calledOnce);
        });

        it('should not call the observer for an empty stream', function () {
            var called = false;
            stream.observe(stream(), _ => called = true);
            assert.isFalse(called);
        });

        it('should call the observer callback', () => {
            var s = stream(),
                values = [];

            stream.observe(s, val => {values.push(val)});

            s(1);
            s(2);
            assert.sameMembers(values, [1, 2]);
        });

        it('should allow multiple observers', () => {
            var s = stream(),
                values1 = [],
                values2 = [];

            stream.observe(s, val => {values1.push(val)});

            s(1);
            s(2);

            stream.observe(s, val => {values2.push(val)});

            s(3);
            s(4);
            assert.sameMembers(values1, [1, 2, 3, 4]);
            assert.sameMembers(values2, [3, 4]);
        });
    });

    describe('when mapping streams (#map)', function () {
        it('should be a curried function', function () {
            var s = stream(),
                map = stream.map(s),
                spy = sinon.spy();

            map(spy);
            assert.isFalse(spy.called);

            s(1);
            assert.isTrue(spy.called);
        });

        it('should not apply mapping function on empty stream', function () {
            var spy = sinon.spy();
            stream.map(stream(), spy);
            assert.isFalse(spy.called);
        });

        it('should apply the mapping function', function () {
            var s = stream();
            var mapped = stream.map(s, val => val * val);

            s(1);
            assert.equal(mapped(), 1);

            s(2);
            assert.equal(mapped(), 4);
        });
    });

    describe('#merge', function () {
        it('should merge multiple streams', function () {
            var s1 = stream(),
                s2 = stream(),
                s3 = stream(),
                s4 = stream(),
                merged = stream.merge(s1, s2, s3, s4);

            s1(1);
            assert.equal(merged(), 1);

            s2(2);
            assert.equal(merged(), 2);

            s3(3);
            assert.equal(merged(), 3);

            s4(4);
            assert.equal(merged(), 4);
        });

        it('should allow observing of merged streams', () => {
            var s1 = stream(),
                s2 = stream(),
                merged = stream.merge(s1, s2),
                vals = [];

            stream.observe(merged, (val) => {
                vals.push(val);
            });

            s1(1);
            s2(1);
            s1(2);
            s2(2);

            assert.sameMembers([1, 1, 2, 2], vals);
        });
    });

    describe('#combine', function () {
        it('should be able to combine streams without existing values', function () {
            var s1 = stream(),
                s2 = stream(),
                combined = stream.combine(s1, s2, (val1, val2) => val1 + val2);

            assert.isTrue(stream.isEmpty(combined));

            s1(1);
            s2(2);
            assert.isFalse(stream.isEmpty(combined));
            assert.equal(combined(), 3);
        });

        it('should be able to combine streams with existing values', function () {
            var combined = stream.combine(stream(1), stream(2), (v1, v2) => v1 + v2);
            assert.equal(combined(), 3);
        });
    });

    describe('#fromAnimationFrame', function () {
        it('should push updates on every frame', function () {
            var s = stream.fromAnimationFrame(),
                count = 0;

            stream.observe(s, _ => count++);
            requestAnimationFrame.step();
            requestAnimationFrame.step();

            assert.equal(count, 2);
        });

        it('should include the timestamp in the observable data', function () {
            var s = stream.fromAnimationFrame(),
                timestamp;
            
            stream.observe(s, t => timestamp = t);
            requestAnimationFrame.step();
            
            assert.ok(timestamp);
            assert.isTrue(!isNaN(timestamp));
        });
    });

    describe('#fromInterval', function () {
        it('should push the interval id on the stream', function (done) {
            var s = stream.fromInterval(50);
            
            stream.observe(s, (id) => {
                assert.ok(id);
                clearInterval(id);
                done();
            });
        });
        
        it('should push updates on correct interval', function (done) {
            var s = stream.fromInterval(50),
                timestamp = Date.now();
 
            stream.observe(s, (id) => {
                clearInterval(id);
                if (Date.now() - timestamp >= 45) {
                    done();
                } else {
                    done("Incorrect interval");
                }
            });
        });
        
        it('should push updates repeatedly', function (done) {
            var s = stream.fromInterval(50),
                count = 0;
                
            stream.observe(s, (id) => {
                if (++count > 2) {
                    clearInterval(id);
                    done();
                }
            });
        });
    });

    describe('#fromArray', function () {
        it('should push items from array into stream', function () {
            var arr = [1, 2, 3, 4, 5],
                s = stream.fromArray(arr);

            assert.equal(s(), 1);
            assert.equal(s(), 2);
            assert.equal(s(), 3);
            assert.equal(s(), 4);
            assert.equal(s(), 5);
        });

        it('should flush the array once there is an observer', function () {
            var arr = [1, 2, 3, 4, 5],
                s = stream.fromArray(arr),
                vals = [];
            
            stream.observe(s, val => vals.push(val));
            assert.sameMembers(vals, arr);
        });
    });

    describe('#sample', function () {
        it('should sample the first stream by the second', function () {
            var s1 = stream(),
                s2 = stream(),
                sampled = stream.sample(s1, s2);

            s1(1);
            assert.notOk(sampled());

            s2(0);
            assert.equal(sampled(), 1);

            s1(2);
            assert.equal(sampled(), 1);

            s2(0);
            assert.equal(sampled(), 2);
        });

        it('should not sample the first stream unless there is data on the second', function () {
            var s1 = stream(),
                s2 = stream(),
                sampled = stream.sample(s1, s2),
                values = [];

            stream.observe(sampled, val => values.push(val));
            s1(1)(2)(3);
            s2(4)(5);

            s1(4)(5);
            s2(6)(7);

            assert.sameMembers([3, 3, 5, 5], values);
        });
    })
});

const assert = require('chai').assert;
const stream = require('../lib/stream');

describe('streams', function () {
    describe('when creating a stream', function () {
        it('should have a default value of undefined', function () {
            var s = stream();
            assert.notOk(s());
        });

        it('should be able to have an initial value', function () {
            var s = stream(1);
            assert.equal(s(), 1);
        });
    });

    describe('when validating membership (#isStream)', function () {
        it('should be false for non-streams', function () {
            assert.isFalse(stream.isStream());
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

    describe('when getting current value', () => {
        it('should have a value', () => {
            var s = stream(1);
            assert.equal(s(), 1);

            s(2);
            assert.equal(s(), 2);
        });
    });

    describe('when observing a stream (#observe)', () => {
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
        it('should not apply mapping function on empty stream', function () {
            var called = false;
            stream.map(stream(), _ => called = true);
            assert.isFalse(called);
        });

        it('should apply the mapping function', () => {
            var s = stream();
            var mapped = stream.map(s, val => val * val);

            s(1);
            assert.equal(mapped(), 1);

            s(2);
            assert.equal(mapped(), 4);
        });
    });

    describe('when merging streams', () => {
        it('should merge the streams', () => {
            var s1 = stream(),
                s2 = stream(),
                merged = stream.merge(s1, s2);

            s1(1);
            assert.equal(merged(), 1);

            s2(2);
            assert.equal(merged(), 2);
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

    describe('when combining streams (#combine)', () => {
        it('should be able to combine streams without existing values', function () {
            var s1 = stream(),
                s2 = stream(),
                combined = stream.combine(s1, s2, (val1, val2) => {
                    return val1 + val2;
                });

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
});

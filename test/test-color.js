const assert = require('chai').assert;
const color = require('../lib/color');
const observable = require('../lib/observable');

describe('color', function () {
    describe('rgba', function () {
        it('should return a property with color values when passed numeric arguments', function () {
            var c = color.rgba(0.1, 0.2, 0.3, 1);
            assert.isTrue(observable.isProperty(c));
            assert.equal(c(), 'rgba(0.1,0.2,0.3,1)');
        });
    });
});

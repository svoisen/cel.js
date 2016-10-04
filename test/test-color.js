const assert = require('chai').assert;
const color = require('../lib/color');
const stream = require('../lib/stream');

describe('color', function () {
    describe('rgba', function () {
        it('should return a color string with numeric arguments', function () {
            var c = color.rgba(0.1, 0.2, 0.3, 1);
            assert.equal(c(), 'rgba(0.1,0.2,0.3,1)');
        });
    });
});

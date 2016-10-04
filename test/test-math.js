const assert = require('chai').assert;

const math = require('../lib/math');
const stream = require('../lib/stream');

describe('math', function () {
    describe('#sin', function () {
        it('should return a stream that maps to SIN of values', function () {
            var vals = [0, Math.PI/2, Math.PI, 3*Math.PI/4, 2*Math.PI],
                s = stream(),
                mapped = math.sin(s);
                
            s(vals[0]);
            assert.equal(mapped, 0);
        })
    });
});
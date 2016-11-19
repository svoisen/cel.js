const assert = require('chai').assert;
const draw = require('../lib/draw');
const sinon = require('sinon');
const observable = require('../lib/observable');
const _ = require('ramda/src/__');

describe('draw', function () {
    describe('#clear', function () {
        it('should be undefined when color has no value', function () {
            var color = observable.property(),
                bg = draw.clear(color);
            
            assert.notOk(bg());
        });
        
        it('should return a stream of functions', function () {
            var color = observable.property(),
                bg = draw.clear(color),
                spy = sinon.spy();
            
            assert.isTrue(observable.isStream(bg));

            bg.observe(spy);
            color('rgba(1,1,1,1)');

            assert.equal(typeof spy.args[0][0], 'function');
        });
        
        it('should set fill style and fill rect on canvas', function () {
            var color = observable.property(),
                bg = draw.clear(color),
                spy = sinon.spy(),
                mockCanvas = {width: 100, height: 100};
            
            spy.fillRect = sinon.spy(function () {});
            
            bg.observe((fn) => fn(mockCanvas, spy));
            color('white');
            assert.equal(spy.fillStyle, 'white');
            sinon.assert.calledOnce(spy.fillRect);
            sinon.assert.calledWith(spy.fillRect, 0, 0, 100, 100);
        });
    });
});
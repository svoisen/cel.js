const assert = require('chai').assert;
const draw = require('../lib/draw');
const sinon = require('sinon');
const stream = require('../lib/stream');
const _ = require('ramda/src/__');

describe('draw', function () {
    describe('#backgroundColor', function () {
        it('should be undefined when color stream has no value', function () {
            var color = stream(),
                bg = draw.backgroundColor(color);
            
            assert.notOk(bg());
        });
        
        it('should return a stream of functions', function () {
            var color = stream('rgba(1,1,1,1)'),
                bg = draw.backgroundColor(color);
            
            assert.isTrue(stream.isStream(bg));
            assert.isTrue(typeof bg() === 'function');
        });
        
        it('should set fill style and fill rect on canvas', function () {
            var color = stream('white'),
                bg = draw.backgroundColor(color),
                spy = sinon.spy(),
                mockCanvas = {width: 100, height: 100};
            
            spy.fillRect = sinon.spy(function () {});
            
            bg()(mockCanvas, spy);
            assert.equal(spy.fillStyle, 'white');
            sinon.assert.calledOnce(spy.fillRect);
            sinon.assert.calledWith(spy.fillRect, 0, 0, 100, 100);
        });
    });
});
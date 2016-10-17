const assert = require('chai').assert;
const sinon = require('sinon');
const jsdom = require('mocha-jsdom');

const main = require('../lib/main');
const observable = require('../lib/observable');
const util = require('../lib/util');

describe('main', function () {
    jsdom();

    before(function () {
        main.exposeGlobals(window);
    });

    describe('#setup', function () {
        var container,
            sketch;
        
        before(function () {
            container = document.createElement('div');
            container.style.width = '800px';
            container.style.height = '800px';
            sketch = window.setup(container);
        });
        
        it('should return a function', function () {
            assert.ok(sketch);
            assert.isTrue(util.isFunction(sketch));
        });
        
        it('should add a canvas to the provided container', function () {
            assert.equal(container.children.length, 1);
            assert.equal(container.children[0].nodeName, 'CANVAS');
        });
        
        it('should expose the canvas that was added to the container', function () {
            assert.ok(sketch.canvas);
            assert.equal(sketch.canvas.nodeName, 'CANVAS');
            assert.equal(sketch.canvas.parentNode, container);
        });
        
        it.skip('should create a canvas that fills the container', function () {
            assert.equal(sketch.canvas.clientWidth, 800);
            assert.equal(sketch.canvas.clientHeight, 600);
        });
        
        it('should expose the frame stream as a ticker', function () {
            assert.ok(sketch.ticker);
            assert.isTrue(observable.isStream(sketch.ticker));
        });
    });
});

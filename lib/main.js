const color = require('./color');
const draw = require('./draw');
const util = require('./util');
const observable = require('./observable');
const curryN = require('ramda/src/curryN');
const _ = require('ramda/src/__');

function setup(container) {
    var frameStream = observable.fromAnimationFrame(),
        canvas = createCanvas(container),
        ctx = canvas.getContext('2d');
    
    function sketch(input) {
        input = input.toProperty();
        var renderStream = input.sampleBy(frameStream);
        renderStream.observe(curryN(4, render)(_, _, canvas, ctx));
    }
    
    sketch.ticker = frameStream;
    sketch.canvas = canvas;
    
    return sketch;
}

function createCanvas(container) {
    var canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);

    return canvas;
}

function render(input, inputStream, canvas, ctx) {
    if (!Array.isArray(input)) {
        input = [input];
    }

    input.forEach((fn) => fn(canvas, ctx));
}

function exposeGlobals(root) {
    root.clear = draw.clear;
    root.clearBefore = draw.clearBefore;
    root.ellipse = draw.ellipse;
    root.observable = observable;
    root.setup = setup;
    root.rgba = color.rgba;
}

exports.setup = setup;
exports.exposeGlobals = exposeGlobals;

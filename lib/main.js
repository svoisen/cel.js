const color = require('./color');
const draw = require('./draw');
const util = require('./util');
const stream = require('./stream');
const curryN = require('ramda/src/curryN');
const _ = require('ramda/src/__');

function setup(container) {
    var frameStream = stream.fromAnimationFrame(),
        canvas = createCanvas(container),
        ctx = canvas.getContext('2d');
    
    function sketch(inputStream) {
        var renderStream = stream.sample(inputStream, frameStream);
        stream.observe(renderStream, curryN(4, render)(_, _, canvas, ctx));
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
    input(canvas, ctx);
}

function exposeGlobals(root) {
    root.clear = draw.clear;
    root.ellipse = draw.ellipse;
    root.stream = stream;
    root.setup = setup;
    root.rgba = color.rgba;
}

exports.setup = setup;
exports.exposeGlobals = exposeGlobals;

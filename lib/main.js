const color = require('./color');
const draw = require('./draw');
const util = require('./util');
const stream = require('./stream');
const curryN = require('ramda/src/curryN');
const _ = require('ramda/src/__');

function setup(container) {
    var frameStream = stream.fromAnimationFrame(),
        inputStream = stream(),
        renderStream = stream.sample(inputStream, frameStream),
        canvas = createCanvas(container),
        ctx = canvas.getContext('2d');

    stream.observe(renderStream, curryN(3, render)(_, canvas, ctx));
    
    function sketch(input) {
        inputStream(input);
    }
    
    sketch.ticker = frameStream;
    sketch.canvas = canvas;
    
    return sketch;
}

function createCanvas(container) {
    var canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    return canvas;
}

function render(input, canvas, ctx) {
    input()(canvas, ctx);
}

function exposeGlobals() {
    window.backgroundColor = draw.backgroundColor;
    window.setup = setup;
    window.rgba = color.rgba;
}

exports.setup = setup;

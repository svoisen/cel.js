const observable = require('./observable');
const util = require('./util');

function clear(color) {
    color = observable.toProperty(color);
    
    return observable.map(color, val => {
        return function (canvas, ctx) {
            ctx.fillStyle = val;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
    });
}

function ellipse(x, y, xRad, yRad, fillColor) {
    var args = util.copyToArray(arguments),
        mapFn = function (x, y, xRad, yRad, fillColor) {
            return function (canvas, ctx) {
                console.log('DRAWING ellipse ' + fillColor);
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(x, y, xRad, yRad, 0, 0, Math.PI * 2, false);
                ctx.restore();
                ctx.fillStyle = fillColor;
                ctx.fill();
            };
        };
    
    return observable.combine.apply(this, args.concat([mapFn]));
}

exports.clear = clear;
exports.ellipse = ellipse;
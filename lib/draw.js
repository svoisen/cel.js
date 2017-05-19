const observable = require('./observable');
const util = require('./util');

function clear(color) {
    return observable.toProperty(color)
                     .map(val => _clear(val));
}

function _clear(color) {
    return function (canvas, ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function clearBefore(input, color) {
    return observable.map(input, (val) => {
        return [_clear(color), val];
    })
}

function rect(x, y, width, height, fillColor) {

}

function ellipse(x, y, xRad, yRad, fillColor) {
    var args = util.copyToArray(arguments),
        mapFn = function (x, y, xRad, yRad, fillColor) {
            return function (canvas, ctx) {
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
exports.clearBefore = clearBefore;
exports.ellipse = ellipse;
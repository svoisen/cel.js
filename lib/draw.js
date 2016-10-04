const stream = require('./stream');
const util = require('./util');

function backgroundColor(color) {
    color = stream.coerce(color);
    
    return stream.map(color, val => {
        return function (canvas, ctx) {
            ctx.fillStyle = val;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
    });
}

exports.backgroundColor = backgroundColor;
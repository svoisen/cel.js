const stream = require('./stream');

function sin(x) {
    x = stream.coerce(x);
    
    return stream.map(x, x => Math.sin(x));
}

exports.sin = sin;
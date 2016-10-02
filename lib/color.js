const stream = require('stream');

function color() {}

color.rgba = function(r, g, b, a) {
    arguments = arguments.map(enforceStream);

    return stream.combine((red, green, blue, alpha) => {
        return rgbaString(red(), green(), blue(), alpha());
    });
}

function enforceStream(val) {
    return stream.isStream(val) ? val : stream(val);
}

function rgbaString(r, g, b, a) {
    return 'rgba(' + [r(), g(), b(), a()].join(',') + ')';
}

module.exports = color;

var gamejs = require('gramework').gamejs,
    Game = require('./game').Game,
    Dispatcher = require('gramework').Dispatcher,
    gramework = require('gramework'),
    conf = require('./conf');

var main = function() {

    var dispatch = new Dispatcher(gamejs, {
        initial: new Game(),
        canvas: {
            flag: gamejs.display.DISABLE_SMOOTHING
        }
    });
    //dispatch.push(game);

    // Play area.

    gamejs.onTick(function(dt) {
        dispatch.onTick(dt);
    }, this, conf.globals.fps);

    gamejs.onEvent(function(ev) {
        dispatch.onEvent(ev);
    });
};

var images = Object.keys(conf.Images).map(function(img) {
    return conf.Images[img];
});
gramework.init();
gamejs.preload(images);
gamejs.ready(main);
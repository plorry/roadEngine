var gamejs = require('gramework').gamejs,
    conf = require('./conf'),
    CartScene = require('./cart_scene').CartScene,
    GameController = require('gramework').input.GameController,
    animate = require('gramework').animate,
    Road = require('./road').Road,
    Driver = require('./driver').Driver,
    _ = require('underscore');

// Container for the entire game.

var roadSpec = {
    turns: {
        
        31: {
            angle: 70,
            end: 37
        }
    },

    hills: {
        2: {
            height: -40,
            end: 30
        },

        30: {
            height: 30,
            end: 35
        }
    },

    roadObjects: []
};

var Game = exports.Game = function () {
    var road = new Road({
        texturePath: conf.Images.test_texture,
        roadSpec: roadSpec
    });
    
    _.range(0,75).forEach(function(value){
        road.addRoadObject(value, {
            road: road,
            distance: value,
            height: 200,
            width: 200,
            position: 500,
            side: _.sample(['right', 'left']),
            image: 'hHouse01'
        });
    });
    
    this.cont = new GameController();

    this.paused = false;

    this.scene = new CartScene({
        width:320,
        height:220,
        pixelScale: 2,
        road: road,
        image_path: conf.Images.background
    });

    this.d = new Driver({
        spriteSheet: gamejs.image.load(conf.Images.player_cart),
        road: road,
        distance: 2,
        height: 64,
        width: 80,
        position: 0
    });

    this.scene.camera.follow(this.d);

    this.initialize();
};

Game.prototype.initialize = function() {
    var game = this;

    this.controlMapDown = {
        left: function () {
            game.scene.tiltLeft();
        },
        up: function () {
            game.scene.rise();
        },
        right: function () {
            game.scene.tiltRight();
        },
        down: function () {
            game.scene.lower();
        },
        action: function() {

        },
        mousePos: function(pos) {

        },
        menu: function() {
            // MENU
            console.log(game.scene.road.currentAngle);
        },
        cancel: function() {
        },

        left_boost: function() {
            game.d.left_boost_on();
        },

        right_boost: function() {
            game.d.right_boost_on();
        }
    };

    this.controlMapUp = {
        left: function() {
            game.scene.stopLat();
        },

        right: function() {
            game.scene.stopLat();
        },

        up: function() {
            game.scene.slow();
        },

        left_boost: function() {
            game.d.left_boost_off();
        },

        right_boost: function() {
            game.d.right_boost_off();
        }
    }

};

Game.prototype.draw = function(surface) {
    this.scene.draw(surface, {clear: false});
};

Game.prototype.event = function(ev) {
    var key = this.cont.handle(ev);

    if (key) {
        if (key.action == 'keyDown') {
            this.controlMapDown[key.label]();
        }
        if (key.action == 'keyUp') {
            this.controlMapUp[key.label]();
        }
    } else {
        if (ev.key === 191) {
            // Right boost
            if (ev.type === 1) {
                this.controlMapDown['right_boost']();
            } else if (ev.type === 2) {
                this.controlMapUp['right_boost']();
            }
        }
        if (ev.key == 90) {
            // Left boost
            if (ev.type === 1) {
                this.controlMapDown['left_boost']();
            } else if (ev.type === 2) {
                this.controlMapUp['left_boost']();
            }
        }
    }
};


Game.prototype.update = function(dt) {
    if (dt > 1000 / 3) dt = 1000 / 3;
    this.scene.update(dt);
    document.getElementById('debug').innerHTML = Math.floor(1 / (dt / 1000)) + 'fps';
};

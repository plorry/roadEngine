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

    },

    hills: {

    },

    roadObjects: []
};

var Game = exports.Game = function () {
    
    this.cont = new GameController();

    this.paused = false;
    this.music;
    this.musicPlaying = false;

    this.level01 = new CartScene({
        width:320,
        height:220,
        pixelScale: 2,
        difficulty: [4, 4, 6],
        road: new Road({
            texturePath: conf.Images.test_texture,
            roadSpec: roadSpec
        }),
        music: './assets/Happysong.ogg',
        theme: 'woods',
        image_path: conf.Images.background
    });

    this.level02 = new CartScene({
        width:320,
        height:220,
        pixelScale: 2,
        difficulty: [6, 8, 8],
        music: './assets/Happysong.ogg',
        road: new Road({
            texturePath: conf.Images.test_texture,
            roadSpec: roadSpec
        }),
        theme: 'town',
        image_path: conf.Images.background
    });

    this.level03 = new CartScene({
        width:320,
        height:220,
        pixelScale: 2,
        difficulty: [10, 12, 14],
        music: './assets/Happysong.ogg',
        road: new Road({
            texturePath: conf.Images.test_texture,
            roadSpec: roadSpec
        }),
        theme: 'spooky',
        image_path: conf.Images.background
    });

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
            game.currentScene.left_boost_on();
        },

        right_boost: function() {
            game.currentScene.right_boost_on();
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
            game.currentScene.left_boost_off();
        },

        right_boost: function() {
            game.currentScene.right_boost_off();
        }
    };

    this.setScene(this.level01);

};

Game.prototype.draw = function(surface) {
    this.currentScene.draw(surface, {clear: false});
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

Game.prototype.setScene = function(scene) {
    this.currentScene = scene;
    this.setMusic(this.currentScene.music);
};

Game.prototype.playMusic = function() {
    if (this.music) {
        this.music.play();
        this.musicPlaying = true;
    }
};

Game.prototype.setMusic = function(music) {
    this.music = music;
};

Game.prototype.stopMusic = function() {
    if (this.music) {
        this.music.pause();
        this.musicPlaying = false;
    }
};

Game.prototype.update = function(dt) {
    if (dt > 1000 / 3) dt = 1000 / 3;
    this.currentScene.update(dt);
    document.getElementById('fps').innerHTML = Math.floor(1 / (dt / 1000));
    if (this.music && this.musicPlaying == false){
        this.playMusic();
    }

    if (this.currentScene.lost) {
        this.stopMusic();
        this.currentScene.restart();
    }
};

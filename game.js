var gamejs = require('gramework').gamejs,
    conf = require('./conf'),
    CartScene = require('./cart_scene').CartScene,
    GameController = require('gramework').input.GameController,
    animate = require('gramework').animate,
    Road = require('./road').Road,
    Driver = require('./driver').Driver,
    CutScene = require('./cutscene').CutScene,
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

    this.titlescreen = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        image: conf.Images.titlescreen,
        duration: false
    });

    this.cutscene01 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        music: './assets/Introconcise.ogg',
        image: conf.Images.cutscene01
    });

    this.cutscene02 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece02', time: [2, 4]}
        ],
        duration: 6,
        image: conf.Images.cutscene02
    });

    this.cutscene03 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece03_1', move: [200, 0]},
            {image: 'piece03_2'}
        ],
        duration: 6,
        image: conf.Images.cutscene03
    });

    this.cutscene04 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
        ],
        duration: 6,
        image: conf.Images.cutscene04
    });

    this.cutscene05 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece05_1', time: [1, 3]},
            {image: 'piece05_2', time: [4, 6]},
            {image: 'piece05_3', time: [7, 9]},
            {image: 'piece05_4', time: [10, 12]}
        ],
        duration: 13,
        image: conf.Images.cutscene05
    });

    this.cutscene06 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece06_1'},
            {image: 'piece06_2', move: [0, -200]},
            {image: 'piece06_3', time: [4, 6]}
        ],
        duration: 7,
        image: conf.Images.cutscene06
    });

    this.cutscene07 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece07_1', time: [1, 3]},
            {image: 'piece07_2', time: [3.5, 5.5]},
            {image: 'piece07_3', time: [6, 8]}
        ],
        duration: 8,
        image: conf.Images.cutscene07
    });

    this.cutscene08 = new CutScene({
        width: 320,
        height: 220,
        pixelScale: 2,
        pieces: [
            {image: 'piece08_1', move: [2000, 0]},
            {image: 'piece08_2', move: [2000, 0], start: [-700, 150]},
            {image: 'piece08_3', move: [2000, 0], start: [-900, 100]}
        ],
        duration: 4,
        image: conf.Images.cutscene08
    });

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
        music: './assets/Ominous.ogg',
        road: new Road({
            texturePath: conf.Images.test_texture,
            roadSpec: roadSpec
        }),
        theme: 'spooky',
        image_path: conf.Images.background
    });

    this.level = 0;
    this.levels = [
        this.titlesceen,
        this.cutscene01,
        this.cutscene02,
        this.cutscene03,
        this.cutscene04,
        this.cutscene05,
        this.cutscene06,
        this.cutscene07,
        this.cutscene08,
        this.level01,
        this.level02,
        this.level03
    ];

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
            if (game.currentScene.next) {
                game.currentScene.next();
            }
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
            if (game.currentScene.next) {
                game.currentScene.next();
            }
        },

        right_boost: function() {
            game.currentScene.right_boost_on();
            if (game.currentScene.next) {
                game.currentScene.next();
            }
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

    this.setScene(this.titlescreen);
    this.playMusic();
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
    if (this.currentScene.music != 'continue') {
        if (this.musicPlaying) {
            this.stopMusic();
        }
        this.setMusic(this.currentScene.music);
    }
};

Game.prototype.playMusic = function() {
    if (this.music && this.music != 'continue') {
        this.music.play();
        this.musicPlaying = true;
        this.music.loop = true;
    }
};

Game.prototype.setMusic = function(music) {
    this.music = music;
};

Game.prototype.stopMusic = function() {
    if (this.music && this.music != 'continue') {
        this.music.pause();
        this.musicPlaying = false;
    }
};

Game.prototype.update = function(dt) {
    if (dt > 1000 / 3) dt = 1000 / 3;
    this.currentScene.update(dt);
    document.getElementById('fps').innerHTML = Math.floor(1 / (dt / 1000));
    if (this.music != this.currentScene.music && this.currentScene.music != 'continue') {
        this.stopMusic();
        this.setMusic(this.currentScene.music);
        this.playMusic();
    }
    if (this.music && this.musicPlaying == false){
        this.playMusic();
    }

    if (this.currentScene.lost) {
        this.stopMusic();
        this.currentScene.restart();
    }

    if (this.currentScene.cleared) {
        this.level++;
        this.setScene(this.levels[this.level]);
        if (this.currentScene.restart) {
            this.currentScene.restart();
        }
        if (this.currentScene.music != 'continue') {
            this.stopMusic();
        }
    }
};

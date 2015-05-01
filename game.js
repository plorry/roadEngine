var gamejs = require('gramework').gamejs,
    conf = require('./conf'),
    RoadScene = require('./roadscene').RoadScene,
    GameController = require('gramework').input.GameController,
    Biker = require('./biker').Biker,
    animate = require('gramework').animate,
    Road = require('./road').Road,
    Car = require('./road').Car,
    _ = require('underscore');

// Container for the entire game.

var roadSpec = {
    turns: {
        
        5: {
            angle: 70,
            end: 15
        },
        20: {
            angle: -70,
            end: 25
        },
        30: {
            angle: 70,
            end: 35
        },

        40: {
            angle: -70,
            end: 45
        },
        50: {
            angle: 70,
            end: 55
        },

        60: {
            angle: -70,
            end: 65
        },

        125: {
            angle: 70,
            end: 135
        }
    },

    hills: {

    },
    
    crossStreets: {
        5: {
            end: 6
        },

        20: {
            end: 21
        },

        25: {
            end: 27
        }
    },

    bikeLanes: {
        0: {
            end: 500
        }
    },

    sidewalks: {
        0: {
            end: 500
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

    this.car = road.addCar(2, {
        image: 'shrub01',
        road: road,
        distance: 2,
        height: 32,
        width: 32,
        position: 0
    });

    this.cont = new GameController();
    var bike = new Biker({
        x:120,
        y:150,
        width:64,
        height:70,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.biker),
            64,
            70)
    });

    this.paused = false;

    this.scene = new RoadScene({
        width:320,
        height:220,
        pixelScale: 2,
        road: road,
        image_path: conf.Images.bg_toronto
    });

    this.scene.pushEntity(bike);

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
    }
};


Game.prototype.update = function(dt) {
    if (dt > 1000 / 3) dt = 1000 / 3;
    this.scene.update(dt);
};

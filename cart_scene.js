var animate = require('gramework').animate,
    RoadScene = require('./roadscene').RoadScene,
    gamejs = require('gramework').gamejs,
    Driver = require('./driver').Driver,
    Enemy = require('./driver').Enemy,
    Car = require('./road').Car,
    conf = require('./conf'),
    _ = require('underscore');


var themeSets = {
    'woods': [
        {image: 'bigRock', height: 200, width: 200, collisionWidth: 200},
        {image: 'rocks', height: 300, width: 300, collisionWidth: 250},
        {image: 'tree02', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree03', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree04', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree05', height: 400, width: 400, collisionWidth: 100},
        {image: 'water', height: 75, width: 300, collisionWidth: 200},
        {image: 'tree06', height: 400, width: 400, collisionWidth: 100}
    ],
    'town': [
        {image: 'house01', height: 250, width: 250, collisionWidth: 250},
        {image: 'house02', height: 250, width: 250, collisionWidth: 250},
        {image: 'house03', height: 250, width: 250, collisionWidth: 250},
        {image: 'house04', height: 250, width: 250, collisionWidth: 250},
        {image: 'house05', height: 250, width: 250, collisionWidth: 250},
        {image: 'house06', height: 250, width: 250, collisionWidth: 250},
        {image: 'house07', height: 250, width: 250, collisionWidth: 250},
        {image: 'tree02', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree03', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree04', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree05', height: 400, width: 400, collisionWidth: 100},
        {image: 'tree06', height: 400, width: 400, collisionWidth: 100}
    ],
    'spooky': [
        {image: 'ghostHouse03', height: 250, width: 250, collisionWidth: 250},
        {image: 'ghostHouse05', height: 250, width: 250, collisionWidth: 250},
        {image: 'ghostTree01', height: 400, width: 400, collisionWidth: 100},
        {image: 'ghostTree02', height: 400, width: 400, collisionWidth: 100},
        {image: 'ghostTree03', height: 400, width: 400, collisionWidth: 100}
    ],
    'lava': [
        {image: 'volcano01', height: 250, width: 250, collisionWidth: 250},
        {image: 'volcano02', height: 250, width: 250, collisionWidth: 250},
        {image: 'volcano03', height: 250, width: 250, collisionWidth: 250},
        {image: 'lavaTree01', height: 400, width: 400, collisionWidth: 100},
        {image: 'lavaTree02', height: 200, width: 200, collisionWidth: 50},
        {image: 'lavaTree03', height: 400, width: 400, collisionWidth: 100},
        {image: 'lava01', height: 75, width: 300, collisionWidth: 300},
        {image: 'lava02', height: 75, width: 300, collisionWidth: 300},
    ]
};

var CartScene = exports.CartScene = RoadScene.extend({
    initialize: function(options) {
        CartScene.super_.prototype.initialize.apply(this, arguments);

        this.map = false;
        this.mapImage = gamejs.image.load(conf.Images.mapOverlay);
        this.mapHeight = 220;
        this.theme = options.theme || 'lava';
        this.turnList = [];

        // MAP MODE VARS
        this.p1Ready = false;
        this.p2Ready = false;

        _.range(0,180).forEach(function(value){
            var distance = Math.random() * 180;
            var asset = _.sample(themeSets[this.theme]);
            this.road.addRoadObject(distance + 5, {
                road: this.road,
                distance: distance + 5,
                height: asset.height,
                width: asset.width,
                collisionWidth: asset.collisionWidth,
                position: Math.random() * 300 + 500,
                side: _.sample(['right', 'left']),
                image: asset.image
            });
        }, this);

        this.d = new Driver({
            spriteSheet: gamejs.image.load(conf.Images.player_cart),
            road: this.road,
            distance: 2,
            height: 64,
            width: 80,
            position: 0
        });

        this.camera.follow(this.d);

        this.enemies = [];

        this.enemy = new Enemy({
            road: this.road,
            spriteSheet: gamejs.image.load(conf.Images.enemy_cart_01),
            distance: 2,
            height: 48,
            width: 80,
            position: 0
        });

        this.road.roadObjects.push(this.enemy);
        this.road.roadObjects.push(this.d);
        this.enemies.push(this.enemy);

        this.bullyGenerator = new BullyGenerator({
            road: this.road,
            scene: this
        });

        this.showMap();
    },

    showMap: function() {
        this.map = true;
        this.turnList = this.generateTurnList(this.difficulty);
        this.d.loseControl();
    },

    hideMap: function() {
        this.map = false;
        this.d.gainControl();
        this.generateTurns(this.turnList);
    },

    generateTurnList: function(numTurns) {
        var turnList = [];
        _.range(numTurns).forEach(function(i) {
            this.turnList.push(_.sample(['left', 'right']));
        }, this);
        return turnList;
    },

    generateTurns: function(turnList) {
        _.range(turnList.length - 1).forEach(function(i) {
            var direction = turnList[i];
            this.addRandomTurn((i + 1) * 80 + this.camera.distance, direction);
        }, this);
    },

    addRandomTurn: function(distance, direction) {
        var multiplier;
        console.log(direction);
        (direction == 'right') ? multiplier = 1 : multiplier = -1;

        this.road.addHill(distance, 5, 30);
        this.road.addTurn(distance + 1, 6, multiplier * 70);
    },

    update: function(dt, camera) {
        CartScene.super_.prototype.update.apply(this, arguments);

        this.bullyGenerator.update(dt);

        this.enemies.forEach(function(enemy) {
            enemy.setDestinationPosition(this.d.position);
            enemy.speed = (this.d.distance - enemy.distance) / 10;
        }, this);
        this.d.checkCollisions(this.road.roadObjects);
        if (this.d.isCrashing) {
            this.bullyGenerator.activate();
        }

        if (this.road.roadObjects.length < 200) {
            var distance = Math.random() * 180 + this.camera.distance + 50;
            var asset = _.sample(themeSets[this.theme]);
            this.road.addRoadObject(distance, {
                road: this.road,
                distance: distance + 5,
                height: asset.height,
                width: asset.width,
                collisionWidth: asset.collisionWidth,
                position: Math.random() * 300 + 500,
                side: _.sample(['right', 'left']),
                image: asset.image
            });
        }

        // MAP MODE
        if (this.map) {
            if (!this.p1Ready || !this.p2Ready) {
                if (this.mapHeight > 0) {
                    this.mapHeight -= 5;
                }
            } else {
                if (this.mapHeight < 220) {
                    this.mapHeight += 15;
                } else {
                    this.hideMap();
                }
            }
        }
    },

    left_boost_on: function() {
        this.d.left_boost_on();

        if (this.map) {
            this.p1Ready = true;
        }
    },

    right_boost_on: function() {
        this.d.right_boost_on();
        if (this.map) {
            this.p2Ready = true;
        }
    },

    left_boost_off: function() {
        this.d.left_boost_off();
    },

    right_boost_off: function() {
        this.d.right_boost_off();
    },

    draw: function(display, options) {
        this.camera.view.fill('#fff');
        this.camera.view.blit(this.image, [0, (this.camera.horizon - 475)]);
        this.road.draw(this.camera);
        if (this.map) {
            this.camera.view.blit(this.mapImage, [0, this.mapHeight]);
            this.turnList.forEach(function(turn) {
                if (turn == 'left') {

                } else {
                    
                }
            }, this);
        }
        this.camera.draw(display);
        RoadScene.super_.prototype.draw.call(this, display, options);
    }
});


var Bully = Car.extend({
    initialize: function(options) {
        Bully.super_.prototype.initialize.apply(this, arguments);
        this.type = 'bully';
        this.destinationPosition = options.destinationPosition;
        this.destinationDistance = options.destinationDistance;
        this.atDestinationPosition = false;
        this.atDestinationDistance = false;
        this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, 32, 48);
        this.anim = new animate.Animation(this.spriteSheet, 'walking', {
            'walking': {
                frames: [8,9,10,11],
                rate: 15,
                loop: true
            },
            'punch': {
                frames: [4,5,6],
                rate: 7,
                loop: true
            }
        });
    },

    setDestinationPosition: function(position) {
        this.destinationPosition = position;
    },

    update: function(dt) {
        if (!this.atDestinationPosition) {
            if (this.destinationPosition > this.postion) {
                this.lateralSpeed = 3;
            } else if (this.destinationPosition < this.position) {
                this.lateralSpeed = -3;
            }
            if (this.position + 10 > this.destinationPosition && this.position - 10 < this.destinationPosition) {
                this.lateralSpeed = 0;
                this.atDestinationPosition = true;
            }
        }
        if (!this.atDestinationDistance) {
            if (this.distance > this.destinationDistance) {
                this.speed = 0;
                this.atDestinationDistance = true;
            }
        }

        if (this.atDestinationDistance && this.atDestinationPosition) {
            if (this.anim.currentAnimation != 'punch') {
                this.anim.start('punch');
            }
        }
        this.image = this.anim.update(dt);

        Bully.super_.prototype.update.apply(this, arguments);
    }
});


var BullyGenerator = function(options) {
    this.init(options);
};

_.extend(BullyGenerator.prototype, {
    init: function(options) {
        this.elapsed = 0;
        this.road = options.road;
        this.scene = options.scene;
        this.range = [0, 200];
        this.rate = 1;
        this.max = 10;
        this.on = false;
        this.bullies = 0;
        // this.scene = options.scene;
        this.spriteSheets = [
            // gamejs.load(conf.Images.bully01),
            gamejs.image.load(conf.Images.bully02),
            gamejs.image.load(conf.Images.bully03),
            gamejs.image.load(conf.Images.bully04)
        ];
    },

    activate: function() {
        this.on = true;
    },

    generateBully: function(origin) {
        var bully = new Bully ({
            speed: 0.01,
            destinationPosition: Math.floor(Math.random() * 100 - 50 + origin.position),
            destinationDistance: Math.random() * 0.25 + origin.distance - 0.125,
            spriteSheet: _.sample(this.spriteSheets),
            height: 48,
            width: 32,
            position: Math.floor(Math.random() * 200 - 100 + origin.position),
            distance: origin.distance - 1,
            road: this.road
        });

        this.road.roadObjects.push(bully);
    },

    update: function(dt) {
        if (this.on) {
            this.elapsed += dt;
            if (this.elapsed > this.rate * 200) {
                this.elapsed = 0;
                if (this.bullies < this.max) {
                    this.generateBully(this.scene.d);
                    this.bullies++;
                }
            }
        }
    }
});
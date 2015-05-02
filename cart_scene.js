var animate = require('gramework').animate,
    RoadScene = require('./roadscene').RoadScene,
    gamejs = require('gramework').gamejs,
    Driver = require('./driver').Driver,
    Enemy = require('./driver').Enemy,
    Car = require('./road').Car,
    conf = require('./conf'),
    _ = require('underscore');


var CartScene = exports.CartScene = RoadScene.extend({
    initialize: function(options) {
        CartScene.super_.prototype.initialize.apply(this, arguments);

        _.range(0,180).forEach(function(value){
            this.road.addRoadObject(value, {
                road: this.road,
                distance: value + 5,
                height: 200,
                width: 200,
                position: 500,
                side: _.sample(['right', 'left']),
                image: 'hHouse01'
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

        this.generateTurns(4);
    },

    generateTurns: function(numTurns) {
        _.range(numTurns).forEach(function(i) {
            var direction = _.sample(['left', 'right']);
            this.addRandomTurn((i + 1) * 80, direction);
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
    },

    left_boost_on: function() {
        this.d.left_boost_on();
    },

    right_boost_on: function() {
        this.d.right_boost_on();
    },

    left_boost_off: function() {
        this.d.left_boost_off();
    },

    right_boost_off: function() {
        this.d.right_boost_off();
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
                rate: 15,
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
            if (this.position + 5 > this.destinationPosition && this.position - 5 < this.destinationPosition) {
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
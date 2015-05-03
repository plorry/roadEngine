var animate = require('gramework').animate,
    _ = require('underscore'),
    RoadObject = require('./road').RoadObject,
    conf = require('./conf'),
    gamejs = require('gramework').gamejs,
    Car = require('./road').Car;

var DRAG_FACTOR = 0.01;

var Driver = exports.Driver = RoadObject.extend({
    initialize: function(options) {
        Driver.super_.prototype.initialize.apply(this, arguments);
        this.scene = options.scene;
        this.type = 'driver';
        this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, 80, 64);
        this.loseSpriteSheet = new animate.SpriteSheet(gamejs.image.load(conf.Images.lose_01), 144, 96);
        var anim_angles = {};
        _.range(-6,6).forEach(function(num) {
            anim_angles[num] = {
                frames: [(num) + 6], rate: 15, loop: true
            };
        });
        this.anim = new animate.Animation(this.spriteSheet, 0, anim_angles);
        this.animLose = new animate.Animation(this.loseSpriteSheet, 'crash', {
            'crash': {
                frames: _.range(0, 11), rate: 7, loop: false
            }
        });
        this.particleL = 0;
        this.particleR = 0;
        this.road.roadObjects.push(this);
        this.image = options.image;
        this.accel = 0;
        this.topSpeed = 0.5;
        this.speed = 0;
        this.angle = 0;
        this.angularSpeed = 0;
        this.rotates = true;
        this.animationMap = [
            // {range: [-90, -80], anim: -6},
            {range: [-80, -65], anim: -5},
            {range: [-65, -50], anim: -4},
            {range: [-50, -35], anim: -3},
            {range: [-35, -20], anim: -2},
            {range: [-20,-10], anim: -1},
            {range: [-10, 10], anim: 0},
            {range: [10, 20], anim: 1},
            {range: [20, 35], anim: 2},
            {range: [35, 50], anim: 3},
            {range: [50, 65], anim: 4},
            {range: [65, 80], anim: 5}
            //{range: [80, 90], anim: 6}
        ];

        this.control = true;
        this.isCrashing = false;
    },

    stop: function() {
        this.speed = 0;
        this.accel = 0;
    },

    left_boost_on: function() {
        this.left_boost = true;
    },

    right_boost_on: function() {
        this.right_boost = true;
    },

    left_boost_off: function() {
        this.left_boost = false;
    },

    right_boost_off: function() {
        this.right_boost = false;
    },

    loseControl: function() {
        this.control = false;
    },

    gainControl: function() {
        this.control = true;
    },

    hasControl: function() {
        return this.control;
    },

    crash: function() {
        this.isCrashing = true;
        this.loseControl();
        this.width = 144;
        this.height = 96;
        this.rect.width = this.width;
        this.rect.height = this.height;
    },

    checkCollisions: function(objects) {
        objects.some(function(roadObject) {
            if (roadObject.type == 'obstacle') {
                // console.log(roadObject.myBox);
                // console.log(this.myBox);
                // debugger
                if (this.inMyBox(roadObject)) {
                    this.stop();
                    this.crash();
                    return true;
                }
            }
        }, this);
    },

    update: function(dt, camera) {
        Driver.super_.prototype.update.apply(this, arguments);

        this.animationMap.some(function(anim) {
            if ((this.angleToCamera - this.angle) * (180 / Math.PI) > anim.range[0]
                && (this.angleToCamera - this.angle) * (180 / Math.PI) + this.angle < anim.range[1]) {
                // In range
                this.anim.start(anim.anim);
                return true;
            }
        }, this);

        if (!this.isCrashing) {
            this.image = this.anim.update(dt);
        } else {
            this.image = this.animLose.update(dt);
        }

        this.accel = 0;
        this.topSpeed = 0;
        this.angularSpeed = 0;

        if (this.hasControl()) {
            if (this.road.getAltitudeRateAt(this.distance) != 0) {
                this.accel += (0.0005 * Math.cos(this.angle)) * this.road.getAltitudeRateAt(this.distance);
            }
            if (this.left_boost) {
                this.accel += 0.0005;
                this.angularSpeed += 0.02;
                this.particleL += dt;
            }
            if (this.right_boost) {
                this.accel += 0.0005;
                this.angularSpeed -= 0.02;
                this.particleR += dt;
            }
            if (this.right_boost && this.left_boost) {
                if (this.angle < 0) {
                    this.angularSpeed += 0.01;
                } else if (this.angle > 0) {
                    this.angularSpeed -= 0.01;
                }
            }
            // PARTICLES
            if (this.particleL > 100) {
                this.particleL = 0;
                console.log(Particle);
                this.scene.particles.push(new Particle({x: this.rect.left + 10, y: this.rect.top + 34}));
            }

            if (this.particleR > 100) {
                this.particleR = 0;
                this.scene.particles.push(new Particle({x: this.rect.right - 10, y: this.rect.top + 34}));
            }

        } else {
            this.angle = 0;
            this.angularSpeed = 0;
        }

        if(!this.isCrashing) {
            if (this.accel < 0.0006) {
                this.accel = 0.0006;
            }
        }

        if (this.speed > 0.0005) {
            this.accel -= DRAG_FACTOR * this.speed;
        } else {
            this.speed = 0;
        }

        this.speed += this.accel;

        this.angle -= (this.speed * (Math.cos(this.angle))) * this.road.getAngleRateAt(this.distance);
        this.angle += this.angularSpeed;
        if (this.angle > Math.PI / 2) {
            this.angle = Math.PI /2;
        } if (this.angle < -Math.PI / 2) {
            this.angle = -Math.PI/2;
        }
        this.distance += this.speed * (Math.cos(this.angle));
        this.position += (this.speed * (Math.sin(this.angle))) * 100;

        /*
        if (this.speed > 0.195) {
            this.crash();
        }
        */
        this.myBox = {
            'position': [this.position - this.width / 2, this.position + this.width / 2],
            'distance': [this.distance - 0.3, this.distance + 0.3]
        };
    }
});


var Enemy = exports.Enemy = Car.extend({
    initialize: function(options) {
        Enemy.super_.prototype.initialize.apply(this, arguments);
        this.type = 'enemy';
        this.destinationPosition = 0;
        this.minSpeed = 0.13;
        this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, 40, 24);
        this.anim = new animate.Animation(this.spriteSheet, 'static', {
            'static': {
                frames: [0,1],
                rate: 15,
                loop: true
            }
        });
    },

    setDestinationPosition: function(position) {
        this.destinationPosition = position;
    },

    update: function(dt) {
        if (this.destinationPosition != this.postion) {
            this.lateralSpeed = (this.destinationPosition - this.position) / 20;
        }
        this.image = this.anim.update(dt);
        if (this.speed < this.minSpeed) {
            this.speed = this.minSpeed;
        }

        Enemy.super_.prototype.update.apply(this, arguments);
    }
});


var Particle = exports.Particle = function(options) {
    this.init(options);
};

_.extend(Particle.prototype, {
    init: function(options) {
        this.rect = new gamejs.Rect([options.x, options.y], [4, 4]);
        this.elapsed = 0;
        this.dead = false;
    },

    update: function(dt) {
        this.elapsed += dt;
        this.rect.top += 2;
        if (this.elapsed > 1000) {
            this.dead = true;
        }
    },

    draw: function(surface) {
        gamejs.draw.rect(surface, "rgba(200,230,255,0.3)", this.rect);
    }
});

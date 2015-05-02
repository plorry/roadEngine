var animate = require('gramework').animate,
    _ = require('underscore'),
    RoadObject = require('./road').RoadObject,
    Car = require('./road').Car;

var DRAG_FACTOR = 0.01;

var Driver = exports.Driver = RoadObject.extend({
    initialize: function(options) {
        Driver.super_.prototype.initialize.apply(this, arguments);
        this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, 80, 64);
        var anim_angles = {};
        _.range(-6,6).forEach(function(num) {
            anim_angles[num] = {
                frames: [(num) + 6], rate: 15, loop: true
            };
        });
        this.anim = new animate.Animation(this.spriteSheet, 0, anim_angles);
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

        this.image = this.anim.update(dt);

        this.accel = 0;
        this.topSpeed = 0;
        this.angularSpeed = 0;

        if (this.road.getAltitudeRateAt(this.distance) != 0) {
            this.accel += (0.0005 * Math.cos(this.angle)) * this.road.getAltitudeRateAt(this.distance);
        }

        if (this.left_boost) {
            this.accel += 0.001;
            this.angularSpeed += 0.02;
        }
        if (this.right_boost) {
            this.accel += 0.001;
            this.angularSpeed -= 0.02;
        }
        if (this.right_boost && this.left_boost) {
            if (this.angle < 0) {
                this.angularSpeed += 0.01;
            } else if (this.angle > 0) {
                this.angularSpeed -= 0.01;
            }
        }

        this.accel -= DRAG_FACTOR * this.speed;

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
    }
});


var Enemy = exports.Enemy = Car.extend({
    initialize: function(options) {
        Enemy.super_.prototype.initialize.apply(this, arguments);
    },

    update: function(dt) {
        Enemy.super_.prototype.update.apply(this, arguments);
    }
});

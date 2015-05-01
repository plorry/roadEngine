var animate = require('gramework').animate,
    _ = require('underscore'),
    RoadObject = require('./road').RoadObject;

var DRAG_FACTOR = 0.01;

var Driver = exports.Driver = RoadObject.extend({
    initialize: function(options) {
        Driver.super_.prototype.initialize.apply(this, arguments);
        this.spriteSheet = new animate.SpriteSheet(options.spriteSheet, 26, 16);
        var anim_angles = {};
        _.range(-6,6).forEach(function(num) {
            anim_angles[num] = {
                frames: [(num * 2) + 12], rate: 15, loop: true
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
            {range: [-90, -75], anim: -5},
            {range: [-75, -60], anim: -4},
            {range: [-60, -45], anim: -3},
            {range: [-45, -30], anim: -2},
            {range: [-30,-15], anim: -1},
            {range: [-15, 15], anim: 0},
            {range: [15, 30], anim: 1},
            {range: [30, 45], anim: 2},
            {range: [45, 60], anim: 3},
            {range: [60, 75], anim: 4},
            {range: [75, 90], anim: 5}
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

        if (this.road.getAltitudeAt(this.distance) > 0) {
            this.accel += 0.001;
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
        if (this.speed < 0) {
            this.speed = 0;
        }
        this.angle += this.angularSpeed;
        if (this.angle > Math.PI) {
            this.angle -= 2 * Math.PI;
        } if (this.angle < -Math.PI) {
            this.angle += 2 * Math.PI;
        }
        document.getElementById('debug').innerHTML = this.angleToCamera * (180 / Math.PI);
        this.distance += this.speed * (Math.cos(this.angle));
        this.position += (this.speed * (Math.sin(this.angle))) * 100;
    }
});
var RoadObject = require('./road').RoadObject;

var DRAG_FACTOR = 0.01;

var Driver = exports.Driver = RoadObject.extend({
    initialize: function(options) {
        Driver.super_.prototype.initialize.apply(this, arguments);
        this.road.roadObjects.push(this);
        this.image = options.image;
        this.accel = 0;
        this.topSpeed = 0.5;
        this.speed = 0;
        this.angle = 0;
        this.angularSpeed = 0;
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

    update: function(dt) {
        this.accel = 0;
        this.topSpeed = 0;
        this.angularSpeed = 0;
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
        document.getElementById('debug').innerHTML = this.angle;
        this.distance += this.speed * (Math.cos(this.angle));
        this.position += (this.speed * (Math.sin(this.angle))) * 100;
    }
});
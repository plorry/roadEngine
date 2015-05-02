var Scene = require('gramework').Scene,
    gamejs = require('gramework').gamejs,
    _ = require('underscore');

var RoadScene = exports.RoadScene = Scene.extend({
    initialize: function(options) {
        this.road = options.road;
        this.image = gamejs.image.load(options.image_path);
        this.camera = new Camera({width: 320, height: 220}, {
            background: this.image
        });
        this.latSpeed = 0;
    },

    getCamera: function() {
        return this.camera;
    },

    tiltLeft: function() {
        this.camera.setXSpeed(-2);
    },

    tiltRight: function() {
        this.camera.setXSpeed(2);
    },

    rise: function() {
        this.camera.height += 10;
    },

    lower: function() {
        this.camera.height -= 10;
    },

    stopLat: function() {
        this.camera.setXSpeed(0);
    },

    accel: function() {
        this._accel = 0.001;
    },

    brake: function() {
        this._accel = -0.01;
    },

    slow: function() {
        this._accel = -0.001;
    },

    update: function(dt) {
        this.road.update(dt, this.camera);
        this.camera.setHeightOffset(this.road.getAltitudeAt(this.camera.distance));
        this.camera.setHorizon(300 - (this.road.getAltitudeRateAt(this.camera.distance) * 30));
        this.camera.update(dt);
        //this.camera.setAngle(this.road.getAngleAt(this.camera.distance));
        this.road.setDistance(this.distance);
        RoadScene.super_.prototype.update.call(this, dt);
    },

    draw: function(display, options) {
        this.camera.view.fill('#fff');
        this.camera.view.blit(this.image, [0, 0]);
        this.road.draw(this.camera);
        this.camera.draw(display);
        RoadScene.super_.prototype.draw.call(this, display, options);
    }
});


var Camera = function(dimensions, options) {
    this.init(dimensions, options);
};

_.extend(Camera.prototype, {
    init: function(dimensions, options) {
        this.distance = options.distance || 0;
        this.height = options.height || 0;
        this.heightOffset = 0;
        this.tilt = 0;
        this.horizon = 300;
        this.horizonActual = 300;
        this.center = options.center || 0;
        this.angle = options.angle || 0;
        this.speed = options.speed || {x: 0, y: 0, z: 0};
        this.accel = options.accel || {x: 0, y: 0, z: 0};
        this.view = new gamejs.Surface(new gamejs.Rect([0, 0], [dimensions.width, dimensions.height]));
        this.outView = this.view.clone();
        this.background = options.background;
        this._follow;
    },

    setAngle: function(angle) {
        this.angle = angle;
    },

    setCenter: function(center) {
        this.center = center;
    },

    setHeight: function(height) {
        this.height = height; //+ this.heightOffset;
    },

    setHeightOffset: function(heightOffset) {
        this.heightOffset = heightOffset;
    },

    setHorizon: function(horizon) {
        this.goToHorizon = horizon;
    },

    setTilt: function(tilt) {
        this.tilt = tilt;
    },

    setDistance: function(distance) {
        this.distance = distance;
    },

    setXSpeed: function(speed) {
        this.speed.x = speed;
    },

    setYSpeed: function(speed) {
        this.speed.y = speed;
    },

    setZSpeed: function(speed) {
        this.speed.z = speed;
    },

    follow: function(roadObject) {
        this._follow = roadObject;
    },

    update: function(dt) {
        if (this._follow) {
            this.speed.z = ((this._follow.distance - 1) - this.distance)/ 10;
            this.speed.x = ((this._follow.position) - this.center);
        }
        this.setXSpeed(this.speed.x + this.accel.x);
        this.setYSpeed(this.speed.y + this.accel.y);
        this.setZSpeed(this.speed.z + this.accel.z);

        this.setCenter(this.center + this.speed.x);
        this.setHeight(this.height + this.speed.y);
        this.setDistance(this.distance + this.speed.z);

        if (this.goToHorizon != this.horizonActual) {
            this.horizonActual += (this.goToHorizon - this.horizonActual) / 5;
        }
        this.horizon = Math.floor(this.horizonActual);
    },

    draw: function(display) {
        if (this.background) {
            this.outView.blit(this.background);
        }
        this.outView.blit(this.view);
        display.blit(this.outView, display.rect);
    }
});
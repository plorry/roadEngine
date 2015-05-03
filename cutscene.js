var Scene = require('gramework').Scene,
    gamejs = require('gramework').gamejs,
    conf = require('./conf'),
    _ = require('underscore');


var CutScene = exports.CutScene = Scene.extend({
    initialize: function(options) {
        this.image = gamejs.image.load(options.image);
        if (options.music) {
            this.music = new Audio(options.music);
        } else {
            this.music = 'continue';
        }
        this.pieces = options.pieces || [];
        this.images = {};
        this.elapsed = 0;
        this.cleared = false;
        this.duration = options.duration * 1000;
        this.pieces.forEach(function(piece) {
            this.images[piece.image] = gamejs.image.load(conf.Images[piece.image]);
        }, this);
    },

    update: function(dt) {
        this.elapsed += dt;
        if (this.duration && this.elapsed > this.duration) {
            this.cleared = true;
        }
    },

    next: function() {
        this.cleared = true;
    },

    draw: function(surface) {
        surface.blit(this.image, surface.rect);
        this.pieces.forEach(function(piece) {
            if (piece.time) {
                if (this.elapsed > piece.time[0] * 1000 && this.elapsed < piece.time[1] * 1000) {
                    surface.blit(this.images[piece.image], surface.rect);
                }
            } else if (piece.move){
                if (!piece.start) {
                    piece.start = [0,0];
                }
                var xOffset = Math.floor(piece.move[0] * (this.elapsed / this.duration)) + piece.start[0];
                var yOffset = Math.floor(piece.move[1] * (this.elapsed / this.duration)) + piece.start[1];
                surface.blit(this.images[piece.image], surface.rect.move(xOffset, yOffset));
            } else {
                surface.blit(this.images[piece.image], surface.rect);
            }
        }, this);
    }


});
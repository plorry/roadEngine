var animate = require('gramework').animate,
    Entity = require('gramework').Entity,
    _ = require('underscore');

var Biker = exports.Biker = Entity.extend({
    initialize: function(options) {
        this.spriteSheet = options.spriteSheet;
        this.anim = new animate.Animation(this.spriteSheet, "static", {static:
            {
                frames: _.range(0,5), rate: 15, loop: true
            }});
        this.image = this.anim.update(0);
        this.anim.setFrame(0);
    },

    update: function(dt) {
        this.image = this.anim.update(dt);
    }
});
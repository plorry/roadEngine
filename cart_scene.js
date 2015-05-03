var animate = require('gramework').animate,
    RoadScene = require('./roadscene').RoadScene,
    gamejs = require('gramework').gamejs,
    Driver = require('./driver').Driver,
    Enemy = require('./driver').Enemy,
    Car = require('./road').Car,
    conf = require('./conf'),
    Barricade = require('./driver').Barricade,
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
        this.startOptions = options;
        this.type == 'cart_scene';

        this.difficulty = options.difficulty;
        this.phase = 0;
        this.map = false;
        this.mapImage = gamejs.image.load(conf.Images.mapOverlay);
        this.leftArrow = gamejs.image.load(conf.Images.arrowLeft);
        this.rightArrow = gamejs.image.load(conf.Images.arrowRight);
        this.stageClear = gamejs.image.load(conf.Images.stageClear);
        this.road.clear();
        this.mapHeight = 220;
        this.theme = options.theme || 'woods';
        this.turnList = [];
        this.barricadeTimer = 0;
        this.musicIsPlaying = false;
        this.music = new Audio(options.music);
        this.loseMusic = new Audio('./assets/Youlose.ogg');
        this.loseMusic.loop = false;

        this.particles = [];
        this.levelClear = false;
        // Restart level if lost
        this.loseCounter = 0;
        this.lost = false;
        // Next level if cleared
        this.done = false;
        this.clearedCounter = 0;
        this.cleared = false;

        // MAP MODE VARS
        this.p1Ready = false;
        this.p2Ready = false;
        this.p1ReadyForInput = true;
        this.p2ReadyForInput = true;

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
            scene: this,
            spriteSheet: gamejs.image.load(conf.Images.player_cart),
            road: this.road,
            speed: 0.1,
            distance: 2,
            height: 64,
            width: 80,
            position: 0
        });

        this.camera.follow(this.d);

        this.enemies = [];

        for (var i = 0; i < 3; i++) {
            var enemy = new Enemy({
                road: this.road,
                spriteSheet: gamejs.image.load(conf.Images.enemy_cart_01),
                distance: 1,
                height: 48,
                width: 80,
                position: 0
            });
            this.road.roadObjects.push(enemy);
            this.enemies.push(enemy);
        }

        this.road.roadObjects.push(this.d);

        this.bullyGenerator = new BullyGenerator({
            road: this.road,
            scene: this
        });

        this.showMap();
    },

    restart: function() {
        this.initialize(this.startOptions);
    },

    showMap: function() {
        this.map = true;
        this.turnList = this.generateTurnList(this.difficulty[this.phase]);
        this.d.loseControl();
        this.enemies.forEach(function(enemy) {
            enemy.holdBack();
        }, this);
    },

    addBarricade: function() {
        var spriteSheet = gamejs.image.load(conf.Images.barricade01);
        var barricade = new Barricade({
            distance: this.camera.distance + 40,
            width: 144,
            height: 80,
            spriteSheet: spriteSheet,
            type: 'barricade',
            position: Math.random() * 400,
            side: _.sample(['right', 'left']),
            road: this.road
        });

        this.road.roadObjects.push(barricade);
    },

    hideMap: function() {
        this.map = false;
        this.d.gainControl();
        this.generateTurns(this.turnList);
        this.p1Ready = false;
        this.p2Ready = false;
        this.enemies.forEach(function(enemy) {
            enemy.gunIt();
        }, this);
    },

    generateTurnList: function(numTurns) {
        var turnList = [];
        _.range(numTurns).forEach(function(i) {
            turnList.push(_.sample(['left', 'right']));
        }, this);
        return turnList;
    },

    generateTurns: function(turnList) {
        _.range(turnList.length).forEach(function(i) {
            var direction = turnList[i];
            this.addRandomTurn((i + 1) * 80 + this.camera.distance, direction);
        }, this);
    },

    addRandomTurn: function(distance, direction) {
        var multiplier;
        (direction == 'right') ? multiplier = 1 : multiplier = -1;

        this.road.addHill(distance, 5, 30);
        this.road.addTurn(distance + 1, 6, multiplier * 70);
    },

    update: function(dt, camera) {
        CartScene.super_.prototype.update.apply(this, arguments);

        this.bullyGenerator.update(dt);
        // ENEMY FALLING BEHIND
        this.enemies.forEach(function(enemy) {
            enemy.setDestinationPosition(this.d.position);
            if (enemy.distance < this.camera.distance - 0.1) {
                enemy.distance = this.camera.distance - 0.05;
                if (!this.map && !this.d.isCrashing && !this.done) {
                    enemy.gunIt();
                }
            } else if (enemy.holdingBack) {
                enemy.speed = (this.d.speed - enemy.speed) / 10;
            }

            if (enemy.distance > this.d.distance) {
                enemy.holdBack();
            }

        }, this);
        this.d.checkCollisions(this.road.roadObjects);
        if (this.d.isCrashing) {
            this.bullyGenerator.activate();
        }

        if (this.road.roadObjects.length < 200) {
            var distance = Math.random() * 180 + this.camera.distance + 20;
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

        // BARRICADE TIMER
        if (this.d.control) {
            this.barricadeTimer += dt;
        }
        if (this.barricadeTimer > 40000 / (this.difficulty[this.phase])) {
            this.addBarricade();
            this.barricadeTimer = 0;
        }

        if (Object.keys(this.road.upcomingTurns).length == 0 && !this.map) {
            // Cleared all the turns - go to map!
            this.phase++;
            if (this.phase < this.difficulty.length) {
                this.showMap();
            } else {
                // We've won!
                this.done = true;
            }
        }
        // WINNER!
        if (this.done) {
            this.enemies.forEach(function(enemy) {
                enemy.holdBack();
            });

            this.clearedCounter += dt;
            this.d.loseControl();
        }
        if (this.clearedCounter > 3000) {
            this.cleared = true;
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

        for (var i = this.particles.length - 1; i > 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }

        // PLAYERS HAVE LOST
        if (this.d.isCrashing) {
            this.music = this.loseMusic;
            this.music.loop = false;
            this.loseCounter += dt;
            this.enemies.forEach(function(enemy) {
                enemy.holdBack();
            }, this);
        }
        if (this.loseCounter > 4000) {
            this.lost = true;
        }
    },

    left_boost_on: function() {
        this.d.left_boost_on();
        if (this.map && this.p2ReadyForInput) {
            this.p1Ready = true;
        }
        this.p1ReadyForInput = false;
    },

    right_boost_on: function() {
        this.d.right_boost_on();
        if (this.map && this.p2ReadyForInput) {
            this.p2Ready = true;
        }
        this.p2ReadyForInput = false;
    },

    left_boost_off: function() {
        this.d.left_boost_off();
        this.p1ReadyForInput = true;
    },

    right_boost_off: function() {
        this.d.right_boost_off();
        this.p2ReadyForInput = true;
    },

    draw: function(display, options) {
        this.camera.view.fill('#fff');
        this.camera.view.blit(this.image, [0, (this.camera.horizon - 475)]);
        this.road.draw(this.camera);

        this.particles.forEach(function(particle) {
            particle.draw(this.camera.view);
        }, this);

        if (this.map) {
            this.camera.view.blit(this.mapImage, [0, this.mapHeight]);
            for (var i = 0; i < this.turnList.length; i++) {
                if (i < 7) {
                    if (this.turnList[i] == 'left') {
                        this.camera.view.blit(this.leftArrow, [55 + i * 30, this.mapHeight + 35]);
                    } else {
                        this.camera.view.blit(this.rightArrow, [55 + i * 30, this.mapHeight + 35]);
                    }
                } else {
                    if (this.turnList[i] == 'left') {
                        this.camera.view.blit(this.leftArrow, [55 + (i - 7) * 30, this.mapHeight + 70]);
                    } else {
                        this.camera.view.blit(this.rightArrow, [55 + (i - 7) * 30, this.mapHeight + 70]);
                    }
                }
            }
        }

        if (this.done) {
            this.camera.view.blit(this.stageClear);
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
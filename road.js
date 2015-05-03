var gamejs = require('gramework').gamejs,
    Entity = require('gramework').Entity,
    _ = require('underscore'),
    conf = require('./conf');

ANGLE_SCALE_CONSTANT = 100;

var RoadObject = exports.RoadObject = Entity.extend({
    initialize: function(options) {
        this.type = options.type || 'obstacle';
        this.height = options.height;
        this.width = options.width;
        this.collisionWidth = options.collisionWidth || this.width;
        this.color = options.color;
        this.distance = options.distance;
        this.currentDistance = 0;
        this.road = options.road;
        this.position = options.position || 0;
        this.side = options.side || 'right';
        this.diffDistance = this.distance - this.road.currentDistance;
        this.scaleFactor;
        this.image = this.road.images[options.image];
        this.angleToCamera = 0;
        this.rotates = options.rotates || false;

        if (this.side == 'left') {
            if (this.image) {
                this.image = gamejs.transform.flip(this.image, true);
            }
            this.position = -this.position;
        }


        this.myBox = {
            'position': [this.position - (1/2) * this.collisionWidth, this.position + (1/2) * this.collisionWidth],
            'distance': [this.distance - 0.3, this.distance + 0.3]
        };
    },

    inMyBox: function(roadObject) {
        var collision = false;
        if (this.myBox.position[0] < roadObject.myBox.position[1]
            && this.myBox.position[1] > roadObject.myBox.position[0]
            && this.myBox.distance[0] < roadObject.myBox.distance[1]
            && this.myBox.distance[1] > roadObject.myBox.distance[0]) {
            collision = true;
        }

        return collision;
    },

    update: function(dt, camera) {
        if (this.rotates) {
            var distanceToCamera = this.distance - camera.distance;
            var positionToCamera = this.position - camera.center;
            this.angleToCamera = Math.atan((positionToCamera / 100) / distanceToCamera);
        }
    },

    draw: function(display, offset, height, distance) {
        this.diffDistance = this.distance - distance;

        this.scaleFactor = 1 / (this.diffDistance);
        //this.angleOffset = thisLine.angleOffset * this.scaleFactor;
        var width = this.width * this.scaleFactor;
        var tHeight = this.height * this.scaleFactor;

        this.rect = new gamejs.Rect(
            [(this.road.displayWidth/2) + (this.position - this.width / 2) * this.scaleFactor - offset, height - tHeight],
            [width, tHeight]
        );
        if (this.image) {
            display.blit(this.image, this.rect);
        } else {
            gamejs.draw.rect(display, "rgb(200,0,0)", this.rect);
        }
    }
});


var Road = exports.Road = function(options) {
    this.init(options);
};

Road.prototype = {
    init: function(options) {
        this.length = options.length;
        this.loadRoad(options.roadSpec);
        this.currentAngle = 0;
        this.currentDistance = 0;
        this.center = 0;
        this.displayWidth;
        this.displayHeight;
        this.lineProperties = [];
        // this.viewProperties = this.getRoadPropertiesAt(this.currentDistance);
        this.toDraw = {};
        this.roadObjects = [];
        var imageKeys = [];
        this.images = {};
        this.currentRoad.roadObjects.forEach(function(ro) {
            if (imageKeys.indexOf(ro.imageFile) < 0) {
                imageKeys.push(ro.imageFile);
            }
        }, this);
        imageKeys.forEach(function(key){
            this.images[key] = gamejs.image.load(conf.Images[key]);
        }, this);

        var scanlines = _.range(0,201),
            line;
        this.lines = [];

        scanlines.forEach(function(lineNo) {
            this.lineProperties[lineNo] = {
                diffDistance: 100 / (201 - lineNo)
            };

            line = new Line({
                road: this,
                lineNo: lineNo
            });

            this.lines.push(line);
            this.toDraw[line.diffDistance] = [line];
        }, this);

        if (options.texturePath) {
            this.loadTexture(options.texturePath);

        }
    },

    loadTexture: function(texturePath) {
        this.textureFile = gamejs.image.load(texturePath);
        this.textureSlices = [];
        var textureWidth = this.textureFile.getSize()[0];
        _.range(this.textureFile.getSize()[1]).forEach(function(y) {
            var sliceSurface = new gamejs.Surface(
                new gamejs.Rect([0,0],[textureWidth, 1]));
            var sliceRect = new gamejs.Rect([0, y], [textureWidth, 1]);
            sliceSurface.blit(this.textureFile, [0,0], sliceRect);
            this.textureSlices.unshift(sliceSurface);
        }, this);
    },

    addRoadObject: function(distance, options) {
        if (options.image in this.images == false){
            // Image not yet stored, must load
            this.images[options.image] = gamejs.image.load(conf.Images[options.image]);
        }

        var roadObject = new RoadObject(options);
        this.roadObjects.push(roadObject);
    },

    addCar: function(distance, roadObject) {
        if (options.image in this.images == false){
            // Image not yet stored, must load
            this.images[options.image] = gamejs.image.load(conf.Images[options.image]);
        }

        var car = new Car(options);
        this.roadObjects.push(car);

        return car;
    },

    setDistance: function(distance) {
        this.currentDistance = distance;
    },

    setCenter: function(center) {
        this.center = center;
    },

    loadRoad: function(roadSpec) {
        this.currentRoad = roadSpec;
    },

    getAngleRateAt: function(distance) {
        var angle = 0;
        for (d in this.upcomingTurns) {
            var turn = this.upcomingTurns[d];
            if (distance > d && distance < turn.end) {
                angle = turn.angle / (turn.end - d);
            }
        }
        return angle * 0.017;
    },

    getAngleAt: function(distance, cameraDistance) {
        var angle = 0;
        var base;
        for (d in this.upcomingTurns) {
            var turn = this.upcomingTurns[d];
            if (d < cameraDistance) {
                base = cameraDistance;
            } else {
                base = d;
            }
            if (distance > turn.end) {
                angle += (turn.angle * (turn.end - base) / (turn.end - d));
            }
            if (distance > d && distance < turn.end) {
                angle += turn.angle / ((turn.end - d) / (distance - base));
            }
        }
        // console.log(angle);
        return angle * 0.017;
    },

    getAltitudeRateAt: function(distance) {
        var altitude = 0;
        for (d in this.upcomingHills) {
            var hill = this.upcomingHills[d];
            if (distance > d && distance < hill.end) {
                altitude += hill.height / (hill.end - d);
            }
        }
        return altitude;
    },

    getAltitudeAt: function(distance) {
        var altitude = 0;
        for (d in this.upcomingHills) {
            var hill = this.upcomingHills[d];
            if (distance > hill.end) {
                altitude += hill.height;
            }
            if (distance > d && distance < hill.end) {
                altitude += hill.height / ((hill.end - d) / (distance - d));
            }
        }
        return altitude * 10;
    },

    getWidthAt: function(distance) {
        return 10;
    },

    isCrossStreet: function(distance) {
        var crossStreets = this.currentRoad.crossStreets,
            street;
        for (street in crossStreets) {
            if (distance >= street && distance <= crossStreets[street].end) {
                return true;
            }
            if (street > this.currentDistance + 200) {
                break;
            }
        }
        return false;
    },

    getRoadPropertiesAt: function(distance) {
        var road = this;
        var properties = {
            distance: distance,
            width: road.getWidthAt(distance),
            altitude: road.getAltitudeAt(distance),
            angle: road.getAngleAt(distance)
        };
        return properties;
    },

    collectRoadObjects: function(distance) {
        currentRoadObjects = {};
        this.roadObjects.forEach(function(ro) {
            if (ro.distance >= distance && ro.distance <= distance + 100) {
                if (currentRoadObjects[Math.floor(ro.distance)]) {
                    currentRoadObjects[Math.floor(ro.distance)].push(ro);
                } else {
                    currentRoadObjects[Math.floor(ro.distance)] = [ro];
                }
            }
        }, this);
        /*
        for (i in this.roadObjects) {
            if (i < distance) {

            }
            if (i >= distance && i <= distance + 100) {
                currentRoadObjects[i] = this.roadObjects[i];
            } 
            if (i > this.currentDistance + 100) {
                break;
            }
        }*/
        return currentRoadObjects;
    },

    addHill: function(distance, length, height) {
        this.currentRoad.hills[distance] = {
            height: height,
            end: distance + length
        };
    },

    addTurn: function(distance, length, angle) {
        this.currentRoad.turns[distance] = {
            angle: angle,
            end: distance + length
        };
    },

    clear: function() {
        this.currentRoad.turns = {};
        this.currentRoad.hills = {};
        this.roadObjects = [];
    },

    collectTurns: function(distance) {
        var upcomingTurns = {};
        for (i in this.currentRoad.turns) {
            turn = this.currentRoad.turns[i];
            if (turn.end + 1 >= distance && i <= distance + 200) {
                upcomingTurns[i] = this.currentRoad.turns[i];
            }
        }
        return upcomingTurns;
    },

    collectHills: function(distance) {
        var upcomingHills = {};
        for (i in this.currentRoad.hills) {
            hill = this.currentRoad.hills[i];
            if (hill.end + 1 >= distance && i <= distance + 200) {
                upcomingHills[i] = this.currentRoad.hills[i];
            }
        }
        return upcomingHills;
    },

    collectProperties: function(camera) {
        var scanlines = _.range(0, 201);

        scanlines.forEach(function(lineNo) {
            thisLine = this.lineProperties[lineNo];
            lastLine = this.lineProperties[lineNo - 1];
            thisLine.distance = camera.distance + thisLine.diffDistance;
            thisLine.angle = this.getAngleAt(thisLine.distance);
            thisLine.altitude = this.getAltitudeAt(thisLine.distance);
            thisLine.width = this.getWidthAt(thisLine.distance);

            var deltaAngle = this.viewProperties.angle - thisLine.angle;

            if (lastLine) {
                var deltaDistance = lastLine.diffDistance - thisLine.diffDistance;
                thisLine.angleOffset = lastLine.angleOffset + Math.tan(deltaAngle) * deltaDistance * ANGLE_SCALE_CONSTANT;
            } else {
                thisLine.angleOffset = 0;
            }
        }, this);
    },

    getAccumulatedOffset: function(lineNo) {
        /*
        Iterate over all lines preceding line passed in as argument
        and accumulate the offset
        */
        var offset = 0;
        this.lines.some(function(line) {
            if (line.lineNo > lineNo) {
                return true;
            }
            offset += Math.tan(line.angle) * line.sliceLength * ANGLE_SCALE_CONSTANT;
        });

        return offset;
    },

    update: function(dt, camera) {
        for (var i = this.roadObjects.length - 1; i > 0; i--) {
            if (this.roadObjects[i].type == 'obstacle') {
                if (this.roadObjects[i].distance < camera.distance) {
                    this.roadObjects.splice(i, 1);
                } else {
                    this.roadObjects[i].update(dt, camera);
                }
            } else {
                this.roadObjects[i].update(dt, camera);
            }
        }
        this.drawRoadObjects = this.collectRoadObjects(camera.distance);
        this.upcomingTurns = this.collectTurns(camera.distance);
        this.upcomingHills = this.collectHills(camera.distance);
        this.cameraOffset = (Math.tan(camera.angle) * ANGLE_SCALE_CONSTANT);
        this.lines.sort(function(a, b) {
            return a.lineNo - b.lineNo;
        });
        this.lines.forEach(function(line) {
            line.update(dt, camera);
        });
    },

    draw: function(camera) {
        // Render the road at the given distance
        if (!this.displayWidth && !this.displayHeight) {
            this.displayWidth = camera.view.getSize()[0];
            this.displayHeight = camera.view.getSize()[1];
        }
        var scanlines = _.range(200,0,-1),
            distanceVal, i,
            distanceVals = [];

        for (distanceVal in this.toDraw) {
            distanceVals.push(distanceVal);
        }

        distanceVals.sort(function(a, b) {
            return a - b;
        });
        /*
        for (i = distanceVals.length - 1; i > 0; i--) {
            distanceVal = distanceVals[i];
            this.toDraw[distanceVal].forEach(function(item) {
                item.draw(camera);
            });
        }
        */
        this.lines.sort(function(a, b) {
            return b.lineNo - a.lineNo;
        });
        this.lines.forEach(function(line) {
            line.draw(camera);
        }, this);
        this.lines.forEach(function(line) {
            if (line.temporary) {
                var index = this.lines.indexOf(line);
                this.lines.splice(index, 1);
            }   
        }, this);
    }


};

var Line = function(options) {
    this.init(options);
};

Line.prototype = {
    init: function(options) {
        this.road = options.road;
        this.lineNo = options.lineNo;
        this.diffDistance = 100 / (201 - this.lineNo);
        this.nextDiffDistance = 100 / (201 - (this.lineNo - 1));
        this.sliceLength = this.nextDiffDistance - this.diffDistance;
        this.distance = this.diffDistance;
        this.scaleFactor = 1 / this.diffDistance;
        this.toDraw = [];
        this.temporary = options.temporary || false;
        this.parentHeight = options.parentHeight || 0;
    },

    clearToDraw: function() {
        this.toDraw = [];
    },

    collectToDraw: function() {
        for (distance in this.road.currentRoadObjects) {
            if (distance > this.absDistance && distance <= this.dz) {
            }
        }
    },

    getLineSlice: function(distance) {
        var i = (Math.floor(distance * 40)) % this.road.textureFile.getSize()[1] ;
        return this.road.textureSlices[i];
    },

    update: function(dt, camera) {
        this.distance = camera.distance + this.diffDistance;
        this.altitude = this.road.getAltitudeAt(this.distance);
        this.height = camera.horizon - this.lineNo + Math.floor((this.altitude - camera.height - this.road.getAltitudeAt(camera.distance)) / this.diffDistance);
        // this.heightCam = this.height -= camera.height / this.diffDistance;
        this.width = this.road.getWidthAt(this.distance) * 40 / this.diffDistance;
        this.angle = this.road.getAngleAt(this.distance, camera.distance);
        this.offset = ((camera.center + this.road.getAccumulatedOffset(this.lineNo)) / this.diffDistance) + (this.road.cameraOffset);

        this.nextDistance = camera.distance + this.nextDiffDistance;
        this.nextAltitude = this.road.getAltitudeAt(this.nextDistance);
        this.nextHeight = camera.horizon - (this.lineNo - 1) + Math.floor((this.nextAltitude - camera.height - this.road.getAltitudeAt(camera.distance)) / this.nextDiffDistance);

        if (this.temporary) {
            this.height = this.parentHeight;
        }
        
        // console.log(this.height - this.nextHeight);
        
        if (this.height - this.nextHeight < -1 && this.lineNo > 1 && !this.temporary) {
            // We have a gap between lines - fill with sublines
            var numSteps = this.nextHeight - this.height;
            var deltaDistance = this.nextDistance - this.distance;
            var increment = 1 / numSteps;
            _.range(numSteps).forEach(function(stepNum) {
                
                var lineNo = this.lineNo - ((stepNum + 1) * increment);

                var tempLine = new Line({
                    road: this.road,
                    lineNo: this.lineNo - ((stepNum + 1) * increment),
                    parentHeight: this.height + stepNum + 1,
                    temporary: true
                });
                tempLine.update(dt, camera);
                this.road.lines.push(tempLine);            
            }, this);
        }
        
        // debugger
    },

    draw: function(camera) {
        // Check roadObjects
        if (this.height > 320) {
            return;
        } else if (this.height < 0) {
            return;
        }
        this.road.lines.forEach(function(line) {
            if (line.lineNo < this.lineNo && line.height >= this.height){
                // This line is BEHIND compared line - do not render
                return;
            }
        }, this);

        if (!this.temporary) {

            this.road.roadObjects.forEach(function(ro) {
                if (ro.distance >= this.nextDistance && ro.distance <= this.distance) {
                    this.toDraw.push(ro);
                }
            }, this);
            // Now we draw
            // var stripe = Math.floor(Math.cos(distance * 3));
            // Draw the grass
            var grassRect = new gamejs.Rect([0, this.height], [this.road.displayWidth, 300])
            gamejs.draw.rect(camera.view, "#3dbb5d", grassRect);
        }
        // Draw the road
        if (this.distance) {
            var sliceImage = this.getLineSlice(this.distance);
            var destRect = new gamejs.Rect([(this.road.displayWidth/2) - this.width - this.offset, this.height], [this.width * 2, 1]);
            camera.view.blit(sliceImage, destRect);
        }

        if (!this.temporary) {
            this.toDraw.forEach(function(item) {
                item.draw(camera.view, this.offset, this.height, camera.distance);
            }, this);

            this.clearToDraw();
        }
    }
};

var Car = exports.Car = RoadObject.extend({
    initialize: function(options) {
        Car.super_.prototype.initialize.apply(this, arguments);
        this.type = 'car';
        this.speed = options.speed || 0;
        this.topSpeed = options.topSpeed || 0;
        this.accel = options.accel || 0;
        this.lateralSpeed = 0;
    },

    update: function(dt, camera) {
        this.speed += this.accel;
        this.distance += this.speed;
        this.position += this.lateralSpeed;

        Car.super_.prototype.update.apply(this, arguments);

        this.myBox = {
            'position': [this.position - (1/2) * this.collisionWidth, this.position + (1/2) * this.collisionWidth],
            'distance': [this.distance - 0.1, this.distance + 0.1]
        };
    },

    accelerate: function() {
        this.accel = 0.001;
    }
});
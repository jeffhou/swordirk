// TODO: bug where guy can't stay in place as a move
var keysDown = {};
addEventListener("keydown", function (e) { keysDown[e.keyCode] = true }, false);	
addEventListener("keyup", function (e) { delete keysDown[e.keyCode] }, false);

var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
context.font = "150px Georgia";

canvas.width = 500; canvas.height = 369;
document.body.appendChild(canvas);
attackMoveRange = [];
availableMoves = [];
function Game (numPlayers) {
	this.numPlayers = numPlayers;
	this.currentPlayer = 0;
	this.turnMode = 0;
	// turnMode: 0 = equilibrium, 1 = unit selected (moving), 2 = unit moved (action)
}
var game = new Game(2);

var CONSTANTS = new function () { //Lors notes different ways to make class; this is a singleton (sftwr design pattern) there can only be one instance of this class. 
	this.hashedDirections = [-1000, -1, 1, 1000];
	this.tileWidth = 32;
	this.mapWidth = 15;
	this.mapHeight = 10;
}
function hashCoor (coor) {
	return coor[0] * 1000 + coor[1];
}
function unhashCoor (hashedCoor) {
	return [parseInt(hashedCoor/1000), hashedCoor%1000];
}
//SUNG TIL HERE

var cursor = new function () {
	this.imageObject = new ImageObject ("images/cursor.png");
	this.x = 0;
	this.y = 0;
}

function ImageObject (imagePath) {
	this.image = new Image();
	this.image.ready = false; 		
	this.image.onload = function () {
		this.ready = true;		//??LOR what is going on 
	}
	this.image.src = imagePath;
} ImageObject.prototype.draw = function (x, y) {
	//TODO: Should not draw if not on canvas or not on VBA screen (if relevant)
	if (this.image.ready) {
		context.drawImage(this.image, x, y);
	}
}; ImageObject.prototype.drawScaled = function (x, y, width, height) {
	//TODO: Should not draw if not on canvas or not on VBA screen (if relevant)
	if (this.image.ready) {
		context.drawImage(this.image, x, y, width, height);
	}
}; ImageObject.prototype.drawWithDisplacement = function (x, y, displaceX, displaceY) {
	this.draw(x + displaceX, y + displaceY);
}; ImageObject.prototype.drawOnScreen = function (x, y) {
	this.drawWithDisplacement(x, y, 10, 40);
}; ImageObject.prototype.drawOnGrid = function (tileX, tileY) {
	this.drawOnScreen((tileX - grid.xDisplace) * CONSTANTS.tileWidth, (tileY - grid.yDisplace) * CONSTANTS.tileWidth); //KAR is this making the background?
}; ImageObject.prototype.drawOnScreenScaled = function (x, y, width, height) {
	this.drawScaled(x + 10, y + 40, width, height);
};

function Unit (name, maxHP, attack, move, imagePath, playerID) {
	this.name = name;
	this.maxHP = maxHP;
	this.currentHP = maxHP;
	this.attack = attack;
	this.move = move;
	this.image = new ImageObject (imagePath);
	this.active = true; // turns to false after it moves.
	this.playerID = playerID;
	this.x = 0;
	this.y = 0;
}

function Terrain (traversable) {
	this.traversable = traversable;
	this.unit = null;            //KAR what is dis
} Terrain.prototype.setUnit = function (unit) {
	this.unit = unit;
};
terrainMapObjects = {};
terrainMapObjects[false] = new ImageObject("images/wall_terrain.png");
terrainMapObjects[true] = new ImageObject("images/grass_terrain.png");

blueHighlight = new ImageObject("images/blue_highlight2.png");
redHighlight = new ImageObject("images/red_highlight1.png");

characterPane = new ImageObject("images/character_pane.png");

var units = [];
units.push(new Unit("Seth", 10, 3, 4, "images/character.png", 0));
units.push(new Unit("Eirika", 10, 3, 4, "images/female_character_smiling.png", 0));
units.push(new Unit("Cutthroat", 10, 3, 4, "images/monster.png", 1));

function activateUnits () {
	for (i = 0; i < units.length; i++) {
		units[i].active = true;           
	}
}
function existsActiveUnits () {
	for (i = 0; i < units.length; i++) {
		if(units[i].active) return true;
	}
	return false;
}

function Grid () {
	this.grid = [];
	this.width = 15;
	this.height = 10;
	this.xDisplace = 0;
	this.yDisplace = 0;
	this.selectedObject = null;
	for (i = 0; i < this.width; i++) {
		this.grid.push([]);
		//console.log(this.grid);
		for (j = 0; j < this.height; j++) {
			if (i == 0 || j == 0 || i == this.width - 1 || j == this.height - 1) {
				//console.log(this.grid[i]);
				//console.log(i);
				this.grid[i].push(new Terrain(false));
			} else {
				this.grid[i].push(new Terrain(true));
			}
		}
	}
	this.placeUnitAt(units[0], 1, 1);
	this.placeUnitAt(units[1], 3, 1);
	this.placeUnitAt(units[2], 7, 7);
} Grid.prototype.placeUnitAt = function (unit, x, y) {
	if (this.grid[unit.x][unit.y].unit == unit) {
		this.grid[unit.x][unit.y].unit = null;
	}
	unit.x = x;
	unit.y = y;
	this.grid[x][y].unit = unit;
};
var grid = new Grid();

wrapperImage = new ImageObject("images/vba-window.png");

function processInputs () {
	if (38 in keysDown) { // Player holding the up button       //Karen what is keysDown
		if(cursor.y != 0) {   //if the cursor isn't in the top row
			cursor.y -= 1;  //when you're going up, you're always decreasing the y value
		}
		if (grid.yDisplace > 0 && cursor.y - grid.yDisplace == 2) {
			grid.yDisplace--;
		}
		delete keysDown[38];
    }
    if (40 in keysDown) { // Player holding down
        if(cursor.y != grid.height - 1) {
			cursor.y += 1;
		}
		if (grid.yDisplace < grid.height - CONSTANTS.mapHeight && cursor.y - grid.yDisplace == CONSTANTS.mapHeight - 3) {
			grid.yDisplace++;
		}
		delete keysDown[40]; //?? LOR IDK WHAT ARE THESE DELETE
    }
    if (37 in keysDown) { // Player holding left
        if(cursor.x != 0) {
			cursor.x -= 1;
		}
		if (grid.xDisplace > 0 && cursor.x - grid.xDisplace == 2) {
			grid.xDisplace--;
		}
		delete keysDown[37];
    }
    if (39 in keysDown) { // Player holding right
        if(cursor.x != grid.width - 1) {
			cursor.x += 1;
		}
		if (grid.xDisplace < grid.width - CONSTANTS.mapWidth && cursor.x - grid.xDisplace == CONSTANTS.mapWidth - 3) {
			grid.xDisplace++;
		}
		delete keysDown[39];
    }
	if (90 in keysDown) { // pressed "z" which is actually "a" for our emulator
		//console.log(game.turnMode);
		if (game.turnMode == 0) {//if (grid.selectedObject == null) { // no unit selected yet and "a" just pressed
			if (grid.grid[cursor.x][cursor.y].unit != null && grid.grid[cursor.x][cursor.y].unit.playerID == game.currentPlayer && grid.grid[cursor.x][cursor.y].unit.active) { // cursor is on an active unit belonging to the current player
				grid.selectedObject = grid.grid[cursor.x][cursor.y].unit;
				availableMoves = [];
				availableMoves.push(hashCoor([cursor.x, cursor.y]));
				attackMoveRange = [];
				for(i = 0; i < grid.grid[cursor.x][cursor.y].unit.move; i++){
					var old_length = availableMoves.length;
					for(j = 0; j < old_length; j++){
						for(k = 0; k < CONSTANTS.hashedDirections.length; k++){
							//console.log("i: " + i + " j: " + j + " k: " + k);
							if(availableMoves.indexOf(CONSTANTS.hashedDirections[k] + availableMoves[j]) == -1) { // move not already in list
								if(grid.grid[unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[0]][unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[1]].traversable == true) {
									// line below says you can't move through other ppl's units
									if(grid.grid[unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[0]][unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[1]].unit == null || grid.grid[unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[0]][unhashCoor(CONSTANTS.hashedDirections[k] + availableMoves[j])[1]].unit.playerID == game.currentPlayer) {
										availableMoves.push(CONSTANTS.hashedDirections[k] + availableMoves[j]);									
									}
								}

							} //?? LOR 8)
						}
					}
				}
				for (i = 0; i < availableMoves.length; i++) {
					for (j = 0; j < CONSTANTS.hashedDirections.length; j++) {
						if(availableMoves.indexOf(CONSTANTS.hashedDirections[j] + availableMoves[i]) == -1 && attackMoveRange.indexOf(CONSTANTS.hashedDirections[j] + availableMoves[i]) == -1) {
							attackMoveRange.push(CONSTANTS.hashedDirections[j] + availableMoves[i]);
						}
					}
				}
				game.turnMode = 1;
			}
		} else if (game.turnMode == 1) { //moving
			if (availableMoves.indexOf(hashCoor([cursor.x, cursor.y])) != -1 && (grid.grid[cursor.x][cursor.y].unit == null || grid.grid[cursor.x][cursor.y].unit == grid.selectedObject)) {
				grid.placeUnitAt(grid.selectedObject, cursor.x, cursor.y);
				availableMoves = [];
				attackMoveRange = [];
				for (j = 0; j < CONSTANTS.hashedDirections.length; j++) {
					
						attackMoveRange.push(CONSTANTS.hashedDirections[j] + hashCoor([cursor.x, cursor.y]));
				}
				game.turnMode = 2;
				//console.log
				// unit just moved
			} else {
				console.log("invalid click");	
			}
		} else if (game.turnMode == 2) { //attacking
			if (attackMoveRange.indexOf(hashCoor([cursor.x, cursor.y])) != -1 || hashCoor([cursor.x, cursor.y]) == hashCoor([grid.selectedObject.x, grid.selectedObject.y])) { //clicked in range
				if (grid.grid[cursor.x][cursor.y].unit != null && grid.grid[cursor.x][cursor.y].unit.playerID != game.currentPlayer) { //attacking the enemy unit
					grid.grid[cursor.x][cursor.y].unit.currentHP -= grid.selectedObject.attack; // subtract hp from attacked unit
					if (grid.grid[cursor.x][cursor.y].unit.currentHP <= 0) {  // if enemy died
						units.splice(units.indexOf(grid.grid[cursor.x][cursor.y].unit), 1);
						grid.grid[cursor.x][cursor.y].unit = null;
					}
				} else { //didn't attack anyone and just waited (by clicking on ally or ground)
					//do nothing
				}
				grid.selectedObject.active = false;
				// TODO: should make this into a function
				var allInactive = true;
				for (i = 0; i < units.length; i++) {
					if (units[i].playerID == game.currentPlayer && units[i].active) {
						allInactive = false;
						break;
					}
				}
				if (allInactive) {
					game.currentPlayer = (game.currentPlayer + 1) % game.numPlayers;
					for (i = 0; i < units.length; i++) {
						if (units[i].playerID == game.currentPlayer) {
							units[i].active = true;
						}
					}
				}
				
				// 
				grid.selectedObject = null;
				game.turnMode = 0;
				availableMoves = [];
				attackMoveRange = [];
			} else {
				console.log("invalid click");
			}
			
			// unit needs to perform action or wait
			// check to see if there are any other units of the current player who is active, if none exist, end turn
		}
		delete keysDown[90];
	}
}

function drawAll () {
	wrapperImage.draw(0, 0);
	
	// print units
	for (i = 0; i < CONSTANTS.mapWidth; i++) {
		for (j = 0; j < CONSTANTS.mapHeight; j++) {
			terrainMapObjects[grid.grid[i + grid.xDisplace][j + grid.yDisplace].traversable].drawOnGrid(i + grid.xDisplace, j + grid.yDisplace);
		}
	}

	for(i = 0; i < grid.width; i++){
		for(j = 0; j < grid.height; j++){
			if(availableMoves.indexOf(hashCoor([i + grid.xDisplace, j + grid.yDisplace])) != -1) {
				blueHighlight.drawOnGrid(i, j);
			}
		}
	}

	for(i = 0; i < grid.width; i++){
		for(j = 0; j < grid.height; j++){
			if(attackMoveRange.indexOf(hashCoor([i + grid.xDisplace, j + grid.yDisplace])) != -1) {
				redHighlight.drawOnGrid(i, j);
			}
		}
	}

	for (i = 0; i < CONSTANTS.mapWidth; i++) {
		for (j = 0; j < CONSTANTS.mapHeight; j++) {
			if (grid.grid[i + grid.xDisplace][j + grid.yDisplace].unit) {
				grid.grid[i + grid.xDisplace][j + grid.yDisplace].unit.image.drawOnGrid(i + grid.xDisplace, j + grid.yDisplace);
			}
		}
	}
	cursor.imageObject.drawOnGrid(cursor.x, cursor.y);
	
	if ((cursor_tile = grid.grid[cursor.x][cursor.y]).unit != null) {
		if (cursor.x < 8 && cursor.y < 5) {
			characterPane.drawOnScreen(0, 224);
			context.font = "bold 17px Verdana";
			context.fillStyle = "#000000";
			currentHPString = "" + cursor_tile.unit.currentHP;
			context.fillText(currentHPString, 148 - 10 * currentHPString.length, 224 + 103);
			context.fillText("" + cursor_tile.unit.maxHP, 173, 224 + 103);
			context.font = "bold 18px Courier";
			context.fillText(cursor_tile.unit.name, 172 - cursor_tile.unit.name.length * 7.4, 224 + 81);
			
			context.fillStyle = "#f8f7f5";
			context.fillRect(10 + 86, 40 + 70 + 224, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f6f4e9";
			context.fillRect(10 + 86, 40 + 71 + 224, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f2ecc7";
			context.fillRect(10 + 86, 40 + 72 + 224, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f0e9bb";
			context.fillRect(10 + 86, 40 + 73 + 224, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			cursor_tile.unit.image.drawOnScreenScaled(20, 21 + 224, 56, 56);
		} else {
			characterPane.drawOnScreen(0, 0);
			context.font = "bold 17px Verdana";
			context.fillStyle = "#000000";
			currentHPString = "" + cursor_tile.unit.currentHP;
			context.fillText(currentHPString, 148 - 10 * currentHPString.length, 103);
			context.fillText("" + cursor_tile.unit.maxHP, 173, 103);
			context.font = "bold 18px Courier";
			context.fillText(cursor_tile.unit.name, 172 - cursor_tile.unit.name.length * 7.4, 81);
			
			context.fillStyle = "#f8f7f5";
			context.fillRect(10 + 86, 40 + 70, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f6f4e9";
			context.fillRect(10 + 86, 40 + 71, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f2ecc7";
			context.fillRect(10 + 86, 40 + 72, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			context.fillStyle = "#f0e9bb";
			context.fillRect(10 + 86, 40 + 73, 100 * cursor_tile.unit.currentHP / cursor_tile.unit.maxHP, 1);
			cursor_tile.unit.image.drawOnScreenScaled(20, 21, 56, 56);
		}
	}
};

var main = function () {
	processInputs();
    drawAll();
    requestAnimationFrame(main);
};
main();

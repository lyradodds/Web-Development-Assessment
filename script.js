const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var gridHeight = 7
var gridWidth = 7
var tempo = 100

var cursorPosition = 0;

const noteSize = 36;
const noteGap = 9;
const cursorGap = 5;
const bgColor = [255,255,255];

// array of rows
var grid = []

function sleep(ms) {
	return new Promise(resolve => {setTimeout(resolve,ms)}); 
}

function getSound(y, x) {
	return grid[y][x]
}

// sound example: {note: 'C', sharp: true, octave: 4, sample: "snare"}
function setSound(y, x, sound) {
	grid[y][x] = sound;
}

function addGridRows(n) {
	for (let i=0; i < n; i++) {
		grid.push(new Array(gridWidth));
	}
}

function addGridColumns(n) {
	for (let y=0; y < gridHeight; i++) {
		for (let i=0; i < n; i++) {
			grid[y].push(null);
		}
	}
}

function removeGridRows(n) {
	gridHeight -= n;
}

function removeGridColumns(n) {
	gridWidth -= n;
}

function noteToColor(sound) {
	let hue;
	switch (sound.note[0]) {
		case 'C': hue = [255, 0  , 0  ]; break; // red
		case 'D': hue = [255, 127, 0  ]; break; // orange
		case 'E': hue = [255, 255, 0  ]; break; // yellow
		case 'F': hue = [0  , 255, 0  ]; break; // green
		case 'G': hue = [0  , 127, 255]; break; // teal
		case 'A': hue = [0  , 0,   255]; break; // blue
		case 'B': hue = [127, 0  , 255]; break; // violet
	}
	for (let i=0; i < hue.length; i++) {
		hue[i] = Math.floor(hue[i] * ((sound.octave*10+30) / 100)) + (sound.octave*2)**2;
	}
	return hue;
}

function rgbToCSSColor(color) {
	// color is 3-integer array
	// returns a string like "rgb(255,127,0)"
	return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function intToNote(n) {
	return "CDEFGAB"[n];
}

function drawSequencer() {
	let drawY; let drawX;
	let note;
	for (let y=0; y < gridHeight; y++) {
		drawY = y * noteSize + (y+1) * noteGap;
		for (let x=0; x < gridWidth; x++) {
			drawX = x * noteSize + (x+1) * noteGap;
			sound = getSound(y, x);

			ctx.fillStyle = rgbToCSSColor(noteToColor(sound)); // get note color

			drawShape(drawY, drawX, sound.sample);

			if (sound.sharp) { // draw a white circle in the middle if the note is sharp
				ctx.fillStyle = rgbToCSSColor(bgColor);
				drawShape(drawY+noteSize/2, drawX+noteSize/2, "circle-small");
			}
		}
	}
	drawCursor();
}

function makeSampleNotes() {
	gridHeight = 7; gridWidth = 7;
	for (let y=0; y<7; y++) {
		for (let x=0; x<7; x++) {
			setSound(y, x, {note: intToNote(x), sharp: Math.random()>0.5, octave: y+1, sample: ["snare","chime","horn"][Math.floor(Math.random()*3)]});
		}
	}
}

function drawShape(y, x, shape) {
	switch (shape) {
		case "square-outline":
			ctx.beginPath();
			ctx.moveTo(x-cursorGap			, 	y-cursorGap				);
			ctx.lineTo(x+cursorGap+noteSize	, 	y-cursorGap				);
			ctx.lineTo(x+cursorGap+noteSize	, 	y+cursorGap+noteSize	);
			ctx.lineTo(x-cursorGap		 	,  	y+cursorGap+noteSize	);
			ctx.closePath();
			ctx.stroke();
			break;
		case "circle-small":
			ctx.beginPath();
			ctx.arc(x, y, noteSize/6, 0, Math.PI*2);
			ctx.fill();
			break;
		case "pentagon": case "chime":
			ctx.beginPath(); // drawn clockwise from top
			ctx.moveTo(x+noteSize/2, 		y				);
			ctx.lineTo(x+noteSize, 			y+noteSize/4	);
			ctx.lineTo(x+noteSize*11/13,	y+noteSize		);
			ctx.lineTo(x+noteSize*2/13, 	y+noteSize		);
			ctx.lineTo(x, 					y+noteSize/4	);
			ctx.closePath();
			ctx.fill();
			break;
		case "square": case "snare":
			ctx.fillRect(x, y, noteSize, noteSize);
			break;
		case "circle": case "horn":
			ctx.beginPath();
			ctx.arc(x+noteSize/2, y+noteSize/2, noteSize/2, 0, Math.PI*2);
			ctx.fill();
			break;
	}
}

function advanceCursor() {
	cursorPosition += 1;
	if (cursorPosition >= gridHeight*gridWidth) {
		cursorPosition = 0;
	}
}

function drawCursor() {
	let gridX = cursorPosition % gridWidth;
	let gridY = (cursorPosition - gridX) / gridWidth;

	let drawX = gridX * (noteSize+noteGap) + noteGap;
	let drawY = gridY * (noteSize+noteGap) + noteGap;

	ctx.fillStyle = "black";
	drawShape(drawY, drawX, "square-outline");
}



function mainLoop(timestamp) {
	var progress = timestamp - lastRender

	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawSequencer();

	frameCounter += progress;
	if (frameCounter >= tempo) {
		frameCounter -= tempo;
		advanceCursor();
	}

	lastRender = timestamp;
	window.requestAnimationFrame(mainLoop);
}

function setup() {
	addGridRows(gridHeight); // to initialise grid array
	makeSampleNotes();
}

setup();

var lastRender = 0;

var frameCounter = 0;

window.requestAnimationFrame(mainLoop);
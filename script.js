const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var gridHeight = 7
var gridWidth = 7
var tempo = 30

const noteSize = 12;
const noteGap = 3;
const bgColor = [255,255,255];

// array of rows
var grid = []

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
			ctx.fillStyle = rgbToCSSColor(noteToColor(sound));
			drawShape(drawY, drawX, sound.sample);
			if (sound.sharp) {
				ctx.fillStyle = rgbToCSSColor(bgColor);
				ctx.beginPath();
				ctx.arc(drawX+noteSize/2, drawY+noteSize/2, noteSize/6, 0, Math.PI*2);
				ctx.fill();
			}
		}
	}
}

function makeSampleNotes() {
	gridHeight = 7; gridWidth = 7;
	for (let y=0; y<7; y++) {
		for (let x=0; x<7; x++) {
			setSound(y, x, {note: intToNote(x), sharp: Math.random()>0.5, octave: y+1, sample: ["snare","chime"][Math.floor(Math.random()*2)]});
		}
	}
}

function drawShape(y, x, sample) {
	switch (sample) {
		case "chime": // pentagon
			ctx.beginPath(); // drawn clockwise from top
			ctx.moveTo(x+noteSize/2, 		y				);
			ctx.lineTo(x+noteSize, 			y+noteSize/4	);
			ctx.lineTo(x+noteSize*11/13,	y+noteSize		);
			ctx.lineTo(x+noteSize*2/13, 	y+noteSize		);
			ctx.lineTo(x, 					y+noteSize/4	);
			ctx.closePath();
			ctx.fill();
			break;
		case "snare": // rectangle
			ctx.fillRect(x, y, noteSize, noteSize);
			break;
	}
}

addGridRows(gridHeight);

makeSampleNotes();

drawSequencer();
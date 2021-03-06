const sequencerCanvas = document.getElementById("sequencerCanvas");
const sequencerCtx = sequencerCanvas.getContext("2d");

const paletteCanvas = document.getElementById("paletteCanvas");
const paletteCtx = paletteCanvas.getContext("2d");

const tempoInput = document.getElementById("tempoInput");
const gridHeightInput = document.getElementById("gridHeightInput");
const gridWidthInput = document.getElementById("gridWidthInput");

const synths = new Map();

const synthBasic = new Tone.PolySynth(Tone.Synth).toDestination();
const synthAM = new Tone.AMSynth().toDestination();
const synthMetal = new Tone.MetalSynth().toDestination();
const synthMembrane = new Tone.MembraneSynth().toDestination();
const synthDuo = new Tone.DuoSynth().toDestination();

var gridHeight = 3
var gridWidth = 8
var tempo = 100

var gridGreatestHeight;
var gridGreatestWidth;

var paletteNote = {note: 'C', sharp: false, octave: 4, synth: "basic"};
var selectedPaletteNote = true;

var cursorPosition = 0;

const noteSize = 36;
const noteGap = 9;
const cursorGap = 5;
const bgColor = [255,255,255];

// array of rows
var grid = []

// both arrays - initialised in their respective generate functions
var sequencerButtons;
var paletteButtons;

function getSound(y, x) {
	return grid[y][x]
}

// sound example: {note: 'C', sharp: true, octave: 4, synth: "basic"}
function setSound(y, x, sound) {
	grid[y][x] = sound;
}

function addGridRows(n) {
	while (gridGreatestHeight < gridHeight+n) {
		grid.push(new Array(grid[0].length));
		gridGreatestHeight++;
	}
	gridHeight += n;
	generateSequencerButtons();
}

function addGridColumns(n) {
	while (gridGreatestWidth < gridWidth+n) {
		for (let i=0; i < gridHeight; i++) {
			grid[i].push(undefined);
		}
		gridGreatestWidth++;
	}
	gridWidth += n;
	generateSequencerButtons();
}

function removeGridRows(n) {
	gridHeight -= n;
	generateSequencerButtons();
}

function removeGridColumns(n) {
	gridWidth -= n;
	generateSequencerButtons();
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
	let baseY = (sequencerCanvas.height-getGridPixelHeight())/2;
	let baseX = (sequencerCanvas.width-getGridPixelWidth())/2;
	let drawY; let drawX;
	let note;
	sequencerCtx.clearRect(0,0,sequencerCanvas.width,sequencerCanvas.height);
	for (let y=0; y < gridHeight; y++) {
		drawY = y * noteSize + (y+1) * noteGap;
		for (let x=0; x < gridWidth; x++) {
			drawX = x * noteSize + (x+1) * noteGap;
			drawNote(sequencerCtx, baseY+drawY, baseX+drawX, getSound(y, x));
		}
	}
	drawCursor(baseY, baseX);
}

function drawPalette() {
	let middle = (paletteCanvas.width-noteSize)/2
	let y = noteGap
	let drawY; let drawX;
	
	paletteCtx.clearRect(0,0,paletteCanvas.width,paletteCanvas.height);
	
	drawNote(paletteCtx, y, middle-noteGap*5, paletteNote);
	drawNote(paletteCtx, y, middle+noteGap*5, undefined);
	
	if (selectedPaletteNote) {
		drawShape(paletteCtx, y, middle-noteGap*5, "square-outline");
	} else {
		drawShape(paletteCtx, y, middle+noteGap*5, "square-outline");
	}
	
	// note palette
	y += noteGap
	for (let i=0; i < 7; i++) {
		y += noteGap + noteSize;
		if (i === 0 || i === 1 || i === 3 || i === 4 || i === 5) {
			drawNote(paletteCtx, y, middle-(noteSize+noteGap)/2, {note: intToNote(i), sharp: false, octave: paletteNote.octave, synth: paletteNote.synth})
			drawNote(paletteCtx, y, middle+(noteSize+noteGap)/2, {note: intToNote(i), sharp: true, octave: paletteNote.octave, synth: paletteNote.synth})
			if (paletteNote.note === intToNote(i)) {
				if (paletteNote.sharp) {
					drawShape(paletteCtx, y, middle+(noteSize+noteGap)/2, "square-outline");
				} else {
					drawShape(paletteCtx, y, middle-(noteSize+noteGap)/2, "square-outline");
				}
			}
		} else {
			drawNote(paletteCtx, y, middle, {note: intToNote(i), sharp: false, octave: paletteNote.octave, synth: paletteNote.synth})
			if (paletteNote.note === intToNote(i)) {
				drawShape(paletteCtx, y, middle, "square-outline");
			}
		}
	}
	
	// octave palette
	y += noteSize + noteGap*2
	let x = middle - (noteGap+noteSize)*3
	for (let i=0; i < 7; i++) {
		drawNote(paletteCtx, y, x+(noteGap+noteSize)*i, {note: paletteNote.note, sharp: paletteNote.sharp, octave: i, synth: paletteNote.synth})
		if (paletteNote.octave === i) {
			drawShape(paletteCtx, y, x+(noteGap+noteSize)*i, "square-outline");
		}
	}

	// synth palette
	y += noteSize + noteGap*2
	x = middle - (noteGap+noteSize)*(getSynthCount()/2-0.5)
	let it = synths.keys();
	let val = it.next();
	let i=0;
	while (!val.done) {
		drawNote(paletteCtx, y, x+(noteGap+noteSize)*i, {note: paletteNote.note, sharp: paletteNote.sharp, octave: paletteNote.octave, synth: val.value})
		if (paletteNote.synth === val.value) {
			drawShape(paletteCtx, y, x+(noteGap+noteSize)*i, "square-outline");
		}
		val  = it.next();
		i++;
	}
}

function drawNote(ctx, y, x, note) {
	if (note == undefined) {
		ctx.fillStyle = "black";
		drawShape(ctx, y+noteSize/2, x+noteSize/2, "circle-small");
	} else {
		ctx.fillStyle = rgbToCSSColor(noteToColor(note)); // get note color
		drawShape(ctx, y, x, note.synth);
		if (note.sharp) { // draw a white circle in the middle if the note is sharp
			ctx.fillStyle = rgbToCSSColor(bgColor);
			drawShape(ctx, y+noteSize/2, x+noteSize/2, "circle-small");
		}
	}
}

function drawShape(ctx, y, x, shape) {
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
		case "circle": case "am":
			ctx.beginPath();
			ctx.arc(x+noteSize/2, y+noteSize/2, noteSize/2, 0, Math.PI*2);
			ctx.fill();
			break;
		case "divot": case "membrane":
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.quadraticCurveTo(x+noteSize/2, y+noteSize/2, x+noteSize, y);
			ctx.lineTo(x+noteSize, y+noteSize);
			ctx.quadraticCurveTo(x+noteSize/2, y+noteSize/2, x, y+noteSize);
			ctx.lineTo(x,y);
			ctx.closePath();
			ctx.fill();
			break;
		case "square": case "basic":
			ctx.fillRect(x, y, noteSize, noteSize);
			break;
		case "hexagon": case "metal":
			ctx.beginPath();
			ctx.moveTo(x+noteSize/2	,	y				);
			ctx.lineTo(x+noteSize	,	y+noteSize*1/4	);
			ctx.lineTo(x+noteSize	,	y+noteSize*3/4	);
			ctx.lineTo(x+noteSize/2	,	y+noteSize		);
			ctx.lineTo(x			,	y+noteSize*3/4	);
			ctx.lineTo(x			,	y+noteSize*1/4	);
			ctx.closePath();
			ctx.fill();
			break;
		case "pentagon": case "duo":
			ctx.beginPath(); // drawn clockwise from top
			ctx.moveTo(x+noteSize/2, 		y				);
			ctx.lineTo(x+noteSize, 			y+noteSize/4	);
			ctx.lineTo(x+noteSize*11/13,	y+noteSize		);
			ctx.lineTo(x+noteSize*2/13, 	y+noteSize		);
			ctx.lineTo(x, 					y+noteSize/4	);
			ctx.closePath();
			ctx.fill();
			break;
		}
}

function getCursorY() {
	 return (cursorPosition - getCursorX()) / gridWidth;
}

function getCursorX() {
	return cursorPosition % gridWidth;
}

function drawCursor(baseY, baseX) {
	let gridY = getCursorY();
	let gridX = getCursorX();

	let drawX = gridX * (noteSize+noteGap) + noteGap;
	let drawY = gridY * (noteSize+noteGap) + noteGap;

	sequencerCtx.fillStyle = "black";
	drawShape(sequencerCtx, baseY+drawY, baseX+drawX, "square-outline");
}

function advanceCursor() {
	cursorPosition += 1;
	if (cursorPosition >= gridHeight*gridWidth) {
		cursorPosition = 0;
	}
	let note = grid[getCursorY()][getCursorX()];
	if (note !== undefined) {
		getSynth(note.synth).triggerAttackRelease(note.note+(note.sharp ? "#" : "")+note.octave, "8n");
	}
}

function getGridPixelHeight() {
	return gridHeight*(noteSize+noteGap) + noteGap;
}

function getGridPixelWidth() {
	return gridWidth*(noteSize+noteGap) + noteGap;
}

function getRandomNote() {
	return {note: "CDEFGAB"[Math.floor(Math.random()*7)], sharp: Math.random()>0.5, octave: Math.floor(Math.random()*7), synth: getRandomSynthName()};
}

function randomizeGrid() {
	for (let y=0; y<gridHeight; y++) {
		for (let x=0; x<gridWidth; x++) {
			setSound(y, x, getRandomNote());
		}
	}
}

function clearGrid() {
	for (let y=0; y < gridGreatestHeight; y++) {
		for (let x=0; x < gridGreatestWidth; x++) {
			setSound(y, x, undefined);
		}
	}
}

// assumes 7x7 grid
function makeSampleNotes() {
	for (let y=0; y<7; y++) {
		for (let x=0; x<7; x++) {
			setSound(y, x, {note: intToNote(x), sharp: Math.random()>0.5, octave: y+1, synth: getRandomSynth()});
		}
	}
}



function addSynth(name, synth) {
	synths.set(name, synth);
}

function getSynth(name) {
	return synths.get(name);
}

function getSynthCount() {
	return synths.size;
}

function getRandomSynthName() {
	let keys = []
	let it = synths.keys();
	val = it.next();
	while (!val.done) {
		keys.push(val.value);
		val = it.next();
	}
	return keys[Math.floor(Math.random()*getSynthCount())];
}

function getRandomSynth() {
	return getSynth(getRandomSynthName());
}



function generateSequencerButtons() {
	sequencerButtons = [];
	let baseY = (sequencerCanvas.height-getGridPixelHeight())/2;
	let baseX = (sequencerCanvas.width-getGridPixelWidth())/2;
	let buttonY; let buttonX;
	for (let y=0; y < gridHeight; y++) {
		drawY = y * noteSize + (y+1) * noteGap;
		for (let x=0; x < gridWidth; x++) {
			drawX = x * noteSize + (x+1) * noteGap;
			sequencerButtons.push({buttonY: baseY+drawY, buttonX: baseX+drawX, gridX: x, gridY: y});
		}
	}
}

function generatePaletteButtons() {
	paletteButtons = [];
	let middle = (paletteCanvas.width-noteSize)/2
	let y = noteGap
	let drawY; let drawX;
	
	paletteButtons.push({buttonY: y, buttonX: middle-noteGap*5, type: "paint"});
	paletteButtons.push({buttonY: y, buttonX: middle+noteGap*5, type: "clear"});
	
	// note buttons
	y += noteGap
	for (let i=0; i < 7; i++) {
		y += noteGap + noteSize;
		if (i === 0 || i === 1 || i === 3 || i === 4 || i === 5) {
			paletteButtons.push({buttonY: y, buttonX: middle-(noteSize+noteGap)/2, type: "note", value: intToNote(i)});
			paletteButtons.push({buttonY: y, buttonX: middle+(noteSize+noteGap)/2, type: "sharp-note", value: intToNote(i)});
		} else {
			paletteButtons.push({buttonY: y, buttonX: middle, type: "note", value: intToNote(i)});
		}
	}
	
	// octave buttons
	y += noteSize + noteGap*2
	let x = middle - (noteGap+noteSize)*3
	for (let i=0; i < 7; i++) {
		paletteButtons.push({buttonY: y, buttonX: x+(noteGap+noteSize)*i, type: "octave", value: i});
	}

	// synth buttons
	y += noteSize + noteGap*2
	x = middle - (noteGap+noteSize)*(getSynthCount()/2-0.5)
	let it = synths.keys();
	let val = it.next();
	let i=0;
	
	while (!val.done) {
		paletteButtons.push({buttonY: y, buttonX: x+(noteGap+noteSize)*i, type: "synth", value: val.value});
		val  = it.next();
		i++;
	}
}

function handleSequencerClick(ev) {
	let button;
	for (let i=0; i < sequencerButtons.length; i++) {
		button = sequencerButtons[i]
		if (wasButtonClicked(sequencerCanvas, ev, button)) {
			if (selectedPaletteNote) {
				setSound(button.gridY, button.gridX, structuredClone(paletteNote));
			} else {
				setSound(button.gridY, button.gridX, undefined);
			}
		}
	}
}

function handlePaletteClick(ev) {
	let button;
	for (let i=0; i < paletteButtons.length; i++) {
		button = paletteButtons[i];
		if (wasButtonClicked(paletteCanvas, ev, button)) {
			switch (button.type) {
				case "note":
					paletteNote.note = button.value;
					paletteNote.sharp = false;
					break;
				case "sharp-note":
					paletteNote.note = button.value;
					paletteNote.sharp = true;
					break;
				case "octave":
					paletteNote.octave = button.value;
					break;
				case "synth":
					paletteNote.synth = button.value;
					break;
				case "paint":
					selectedPaletteNote = true;
					break;
				case "clear":
					selectedPaletteNote = false;
					break;
			}
			drawPalette();
		}
	}
}

function wasButtonClicked(canvas, ev, button) {
	let rect = canvas.getBoundingClientRect();
	let my = ev.clientY - rect.top;
	let mx = ev.clientX - rect.left;
	return my > button.buttonY-2 && my <= button.buttonY+noteSize+2
		&& mx > button.buttonX-2 && mx <= button.buttonX+noteSize+2;
}



function mainLoop(timestamp) {
	
	var progress = timestamp - lastRender

	drawSequencer();
	
	tempo = tempoInput.value;
	
	if (gridHeightInput.value > gridHeight) {
		addGridRows(gridHeightInput.value - gridHeight);
	} else if (gridHeightInput.value < gridHeight) {
		removeGridRows(gridHeight - gridHeightInput.value);
	}
	
	if (gridWidthInput.value > gridWidth) {
		addGridColumns(gridWidthInput.value - gridWidth);
	} else if (gridWidthInput.value < gridWidth) {
		removeGridColumns(gridWidth - gridWidthInput.value);
	}

	// tempoCounter counts the number of milliseconds since the last frame
	// if this is greater than tempo, tempo is subtracted from it and the cursor is advanced, playing the next note.
	tempoCounter += progress;
	if (tempoCounter >= tempo) {
		tempoCounter -= tempo;
		advanceCursor();
	}

	lastRender = timestamp;
	window.requestAnimationFrame(mainLoop);
	
}

function setup() {
	
	// initialise grid array
	for (let i=0; i<gridHeight; i++) {
		grid.push(new Array(gridWidth));
	}
	
	gridGreatestHeight = gridHeight;
	gridGreatestWidth = gridWidth;
	
	addSynth("basic", synthBasic);
	addSynth("am", synthAM);
	addSynth("metal", synthMetal);
	addSynth("membrane", synthMembrane);
	addSynth("duo", synthDuo);
	
	generateSequencerButtons();
	generatePaletteButtons();
	
	gridHeightInput.value = gridHeight;
	gridWidthInput.value = gridWidth;
	
	sequencerCanvas.addEventListener("click", handleSequencerClick);
	paletteCanvas.addEventListener("click", handlePaletteClick);
	
	drawPalette();
	
	//makeSampleNotes();
	
}



setup();

var lastRender = 0;

var tempoCounter = 0;

window.requestAnimationFrame(mainLoop);
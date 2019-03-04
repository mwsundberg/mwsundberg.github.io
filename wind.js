// Assets
let directionMap;
let xAudio;
let yAudio;
let wAudio;

// Points
let points = [];

// Settings
const autoAddCap = 500;
const minLength = 0.7;
const strokeScalar = 3;
const velocityBaseScalar = 0.01;
let paused = false;
let velocityScalar;

// Load files 
function preload(){
	soundFormats('wav');
	directionMap = loadImage('assets/directionMap.png');
	xAudio = loadSound('assets/xAudio.wav');
	yAudio = loadSound('assets/yAudio.wav');
	wAudio = loadSound('assets/wAudio.wav');
}


function setup() {
	createCanvas(windowWidth, windowHeight);
	directionMap.loadPixels();
	directionMap.resize(windowWidth, windowHeight);

	stroke(255);
	background(0);

	// Pre-populate the board with 100 random points
	for(let i = 0; i < autoAddCap; i++){
		points.push({x: windowWidth * Math.random(), y: windowHeight * Math.random()});
	}


	velocityScalar = velocityBaseScalar * Math.sqrt(Math.pow(windowWidth, 2) + Math.pow(windowHeight, 2));

	if(paused){
		noLoop();
	}
}

// Resize the canvas automatically
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
	directionMap.resize(windowWidth, windowHeight);
	velocityScalar = velocityBaseScalar * Math.sqrt(Math.pow(windowWidth, 2) + Math.pow(windowHeight, 2));
}

function draw() {
	// Show the direction map while debugging
	if(!paused){
		background(0,0,0,0.5);

		// Make new point
		if(points.length < autoAddCap){
			points.push({x: windowWidth * Math.random(), y: windowHeight * Math.random()});
		}

		// For each point
		for(let i = 0; i < points.length; i++) {
			// Only increment if not paused
				// Increment the point, also check if the length of the path is greater than the min path length, removing otherwise
				if(incrementPoint(points[i]) < minLength){
					removePoint(i);
				}
		}
	}
}

function incrementPoint(point){
	let mapValue = directionMap.get(point.x, point.y); // Get color map value
	let xVelocity    = (mapValue[0]-127) / 127;
	let yVelocity    = (mapValue[1]-127) / 127;
	let strokeMapped = (mapValue[2]) / 255;
	let oldX = point.x;
	let oldY = point.y;

	point.x += velocityScalar * xVelocity;
	point.y += velocityScalar * yVelocity;

	strokeWeight(strokeScalar * strokeMapped);
	line(oldX,
	     oldY,
	     point.x,
	     point.y);

	return (abs(point.x - oldX) + abs(point.y - oldY))/2;
}

function setVolume(){
	let mapValue = directionMap.get(mouseX, mouseY); // Get color map value
	xAudio.setVolume((mapValue[0]) / 255);
	yAudio.setVolume((mapValue[1]) / 255);
	wAudio.setVolume((mapValue[2]) / 255);

}

function mousePressed() {
	// Adding a point
	if(mouseButton == LEFT) {
		points.push({x: mouseX, y: mouseY});

		if(!paused){
			setVolume();
			xAudio.play();
			yAudio.play();
			wAudio.play();
		}
	}

	// Pausing animation
	if(mouseButton == RIGHT) {
		paused = !paused;
		if(!paused){
			console.log("Unpausing.");
			background(0);
			loop();
		} else {
			console.log("Pausing.");
			image(directionMap, 0, 0, windowWidth, windowHeight);
			noLoop();
		}
	}

	if(paused){
		// Redraw each point once
		for(let i = 0; i < points.length; i++) {
			// Only increment if not paused
			// Increment the point, also check if the length of the path is greater than the min path length, removing otherwise
			if(incrementPoint(points[i]) < minLength){
				removePoint(i);
			}
		}
	}
}

// Basic basic function
function removePoint(index){
	points.splice(index, 1);
}
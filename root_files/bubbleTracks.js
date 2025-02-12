let points = [];
let scrollPosition = 20;
const AGE_SCALAR = 10;
const AGE_BASE = 1;
const VELOCITY_SCALAR = 10;
const CIRCLE_SIZE_BASE = 10;
const START_NUM_DOTS = 200;

function setup(){
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 100);
  background(0);
  noStroke();
  smooth();
  textAlign(CENTER);

  // Make the start mouse position be at the center instead of (0, 0)
  mouseX = windowWidth/2;
  mouseY = windowHeight/2;

  // Initializes with some dots
  for(let i = 0; i < START_NUM_DOTS; i++){
    addPoint(Math.random() * windowWidth, Math.random() * windowHeight);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
  background(0,0,0,0.9);
  fill(100);
  
  for(let i = 0; i < points.length; i++){
    let point = points[i];
    point.x += point.xVelocity;
    point.y += point.yVelocity;
    let distFromMouse = Math.sqrt(Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2));

    // Draw a circle that's bigger when far away
    ellipse(point.x, point.y, (scrollPosition/100) * (CIRCLE_SIZE_BASE - distFromMouse), (scrollPosition/100) * (CIRCLE_SIZE_BASE - distFromMouse));

    // Dealing with wall collisions
    if(point.x <= 0 || point.x >= windowWidth){
      point.xVelocity = -point.xVelocity;
    }
    if(point.y <= 0 || point.y >= windowHeight){
      point.yVelocity = -point.yVelocity;
    }

    // Shorthand to array
    points[i] = point;

    // Dealing with age
    // point.age--;
    // if(points[i].age < 0){
    //   points.splice(i, 1);
    // }
  }
}

function mouseWheel(event) {
  scrollPosition += -event.delta;

  // Don't go below 0
  if (scrollPosition < 0) scrollPosition = 1;
}

function mousePressed() {
  addPoint(mouseX, mouseY);
}

function addPoint(x, y) {
  points.push({x: floor(x),
               y: floor(y),
               age: floor(AGE_SCALAR * frameRate() * (AGE_BASE + Math.random())),
               xVelocity: VELOCITY_SCALAR * (Math.random() - 0.5),
               yVelocity: VELOCITY_SCALAR * (Math.random() - 0.5)});
}
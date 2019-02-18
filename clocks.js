function setup(){
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 100);
  background(0);
  noFill();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
  background(0);
  let currentR = toPolarR(mouseX, mouseY);
  let currentTheta = toPolarTheta(mouseX, mouseY);
  //fill(100, 0, 100);
  //text(currentR, 10, 10);
  //text(currentTheta, 10, 20);
  //text(100.0*norm(currentTheta, -PI, PI), 10, 30);
  
  // Custom color bits
  for(let x = 0; x <= windowWidth; x += 50){
    for(let y = 0; y <= windowHeight; y += 50){
      // Stroke
      stroke(100);
      strokeWeight(1);
      ellipse(x, y, 45, 45);
      stroke(100*norm(currentTheta, -Math.PI, Math.PI), 100, 100);
      // Hour Hand
      strokeWeight(3);
      line(x, y, fromPolarXRTO(10, toPolarThetaO(mouseX, mouseY, x, y), x), fromPolarYRTO(10, toPolarThetaO(mouseX, mouseY, x, y), y));
      // Minute Hand
      strokeWeight(1.5);
      line(x, y, fromPolarXRTO(20, 12.0*toPolarThetaO(mouseX, mouseY, x, y) - Math.PI, x), fromPolarYRTO(20, 12.0 * toPolarThetaO(mouseX, mouseY, x, y) - Math.PI, y));
    }
  }
}

//Helper functions for polar math https://www.mathsisfun.com/polar-cartesian-coordinates.html
function toPolar(endX, endY){
  // In (R, Theta) form
  return [toPolarR(endX, endY), toPolarTheta(endX, endY)];
}
function toPolarR(x, y){
  let normalizedX = x - windowWidth / 2.0;
  let normalizedY = y - windowHeight / 2.0;
  return Math.sqrt(Math.pow(normalizedX, 2) + Math.pow(normalizedY, 2));
}
function toPolarTheta(x, y){
  return Math.atan2(y - windowHeight / 2, x - windowWidth / 2);
}
function toPolarRO(x, y, x0, y0){
  let normalizedX = x - x0;
  let normalizedY = y - y0;
  return Math.sqrt(Math.pow(normalizedX, 2) + Math.pow(normalizedY, 2));
}
function toPolarThetaO(x, y, x0, y0){
  return Math.atan2(y - y0, x - x0);
}

function fromPolar(coordinates){
  return [fromPolarX(coordinates), fromPolarY(coordinates)];
}
function fromPolarX(coordinates){
  return coordinates[0] * Math.cos(coordinates[1]) + windowWidth / 2.0; 
}
function fromPolarY(coordinates){
  return coordinates[0] * Math.sin(coordinates[1]) + windowHeight / 2; 
}
function fromPolarXRT(r, theta){
  return r * Math.cos(theta) + origin[0]; 
}
function fromPolarYRT(r, theta){
  return r * Math.sin(theta) + origin[1]; 
}
function fromPolarXRTO(r, theta, x0){
  return r * Math.cos(theta) + x0; 
}
function fromPolarYRTO(r, theta, y0){
  return r * Math.sin(theta) + y0; 
}
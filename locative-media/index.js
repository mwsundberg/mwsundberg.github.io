// Settings
let paused = true;
const urlArgs = new URLSearchParams(window.location.search);
const nightOverride = urlArgs.get('nightOverride');
const mouseLocationOverride = urlArgs.get('mouseLocationOverride');
let isNight = nightOverride || nightPredicate(new Date());

// HTML5 location api settings
const locationApiSettings = {
	enableHighAccuracy: true, 
	maximumAge        : 30000, 
	timeout           : 27000
};

// Map Settings
function mapUrl(isNight){
	return 'https://api.mapbox.com/styles/v1/mapbox/' + (isNight? 'dark-v10':'light-v10') + '/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXdzdW5kYmVyZyIsImEiOiJjanV2YzFrOTkwMDRkNGRtcDkxeGNmcDV0In0.hgudB436hrrR8-JSuxfg8w';
}
const center = [43.12861, -77.630081];
const myLocationMarkerOptions = {
	weight: 3,
	color: '#fff',
	radius: 5,
	fillColor: '#009dff',
	fillOpacity: 1.0
};

// Cache location for loss of access
let lastLocation = null;

// Map initialization
let mymap = L.map('mapid').setView(center, 16);
let myLocationMarker = L.circleMarker(L.latLng(center), myLocationMarkerOptions);

// Mapbox map layer layer
let mapLayer = L.tileLayer(mapUrl(isNight), {
	tileSize: 512,
	maxZoom: 18,
	minZoom: 14,
	zoomOffset: -1,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
});
mapLayer.addTo(mymap);

// Add regions to map, making them non-clickable
L.geoJson(buildingRegions, {style:{interactive:false}}).addTo(mymap);
L.geoJson(generalRegions, {style:{interactive:false}}).addTo(mymap);

myLocationMarker.addTo(mymap);


// If using mouse clicks to set location
if(mouseLocationOverride){
	console.log("Mouse location override handling");
	// Preset the last location as a js Coordinates version of the start location (used by the loop)
	lastLocation = {coords: {
		latitude: center[0],
		longitude: center[1]
	}};

	// Set up an onclick listener for triggering a location update
	mymap.addEventListener("click", function(mouseEvent) {
		console.log("Mouse override setting location to: " + mouseEvent.latlng.lat + ", " + mouseEvent.latlng.lng);
		// Convert the Leaflet coordinates to a js Coordinates object
		lastLocation = {coords: {
			latitude: mouseEvent.latlng.lat,
			longitude: mouseEvent.latlng.lng
		}};

		// Call the normal location found code
		locationFound(lastLocation);
	});

	// Set up a regular looper every 2 seconds that adds a bit of wobble to the location
	window.setInterval(function(){
		console.log("Updating location with random offset.");
		// Add in a random offset
		lastLocation.coords.latitude  += 0.001 * (Math.random() - 0.5);
		lastLocation.coords.longitude += 0.001 * (Math.random() - 0.5);
		
		// Recall the locations function
		if(!paused){
			locationFound(lastLocation);
		}
	}, 2000);
} else {
	// If not using mouse click location override
	if('geolocation' in navigator){
		// Geolocation API dealings
		navigator.geolocation.watchPosition(locationFound, locationUnavailable, locationApiSettings);
	} else {
		console.log('API not supported, sorry.');
	}
}

// Location found (main function)
function locationFound(position) {
	// Location variable updates
	lastLocation = position;
	const latitude  = position.coords.latitude;
	const longitude = position.coords.longitude;
	const myLocationTurf = turf.point([longitude, latitude]);

	// Update map marker
	myLocationMarker.setLatLng(L.latLng(latitude, longitude));

	// Only do audio if enabled to do so
	if(!paused){
		// Check each region for location intersection
		let playedSomething = false;
		buildingRegions.features.forEach(function(feature){
			// If currently in this feature set the flag and dispatch the handler
			if(turf.booleanPointInPolygon(myLocationTurf, feature)){
				console.log('Detected building audio zone ' + feature.properties.region + ".");
				playedSomething = startPlaying(feature.properties.region) || playedSomething;
			} else {
				stopPlaying(feature.properties.region);
			}
		});

		// Catchall cases
		generalRegions.features.forEach(function(feature){
			// If a masking region hasn't been encountered and then is, set the flag and dispatch the handler. Otherwise (flag up or not in region) mute
			if(!playedSomething && turf.booleanPointInPolygon(myLocationTurf, feature)){
				console.log('Detected general audio zone ' + feature.properties.region + ".");
				playedSomething = startPlaying(feature.properties.region) || playedSomething;
			} else {
				stopPlaying(feature.properties.region);
			}
		});
	}
}

// Location query failure
function locationUnavailable() {
	if(lastLocation == null){
		console.log('No position available.');
	} else {
		console.log('Failed to get new location, reusing old.');
	}
}

// On click of the play/pause button
$id("toggle").onclick = function(){
	// Only do something if have location
	if(lastLocation !== null) {
		// If turning on or off interaction
		if(paused){
			// Turning on
			console.log("Starting app running.");
			paused = false;

			// Update overlay and button
			$id("overlay").classList.add("off");
			$id("toggle").innerHTML = "⏸";

			// Jumpstart audio playing by calling the event listener
			locationFound(lastLocation);
		} else {
			// Turning off
			console.log("Stopping all audio and stopping app.");
			paused = true;

			// Update overlay and button
			$id("overlay").classList.remove("off");
			$id("toggle").innerHTML = "▶";


			// Pause all audio
			audioPlaying.forEach(stopPlaying);
		}
	} else { // Last location null
		console.log("Location unavailable.");
	}
}

//////////////////////////////// NIGHTTIME RELATED STUFF ////////////////////////////////
// Check if a time falls into night hours
function nightPredicate(date){
	let hour = mod((date.getUTCHours() - date.getTimezoneOffset()/60), 24);
	return hour < 7 || hour > 21;
}

// Update the night predicate every 10 seconds (only if not overridden,otherwise will always be overridden)
if(!nightOverride){
	window.setInterval(function() {
		// Get the new night variable and compare it
		if(isNight !== nightPredicate(new Date())){
			// Switched night states, update state
			isNight = !isNight;
			console.log("Night was toggled to " + isNight);
			
			// Update the map
			mapLayer.setUrl(mapUrl(isNight));

			// Jumpstart audio playing (if have location)
			if(lastLocation !== null){
				// Call the event listener
				locationFound(lastLocation);
			}
		}
	}, 10000);
}

//////////////////////////////// AUDIO RELATED STUFF ////////////////////////////////
// Set of regions playing audio
let audioPlaying = new Set();

// Start playing a given region (may already be playing, don't want to duplicate in that case)
function startPlaying(region){
	// Check the audio isn't playing already
	if(!audioPlaying.has(region)){
		console.log("starting playing " + region);
		audioPlaying.add(region);

		// Get the audio object
		let toPlay;
		if(isNight){
			toPlay = audioObjects[region].night;
		} else {
			toPlay = audioObjects[region].day;
		}

		// Make sure there is audio
		if(toPlay !== undefined){
			// Start it and make sure it loops
			toPlay.loop = true;
			toPlay.play();
			console.log(toPlay);
		} else {
			// If there's no audio to play
			audioPlaying.delete(region);
			return false;
		}
	}

	// Audio is already playing or successfully started it
	return true;
}

// Stop playing a given region
function stopPlaying(region){
	// Check the audio is playing already
	if(audioPlaying.has(region)){
		console.log("stopping playing " + region);
		audioPlaying.delete(region);

		// Get the audio object
		let toPlay;
		if(isNight){
			toPlay = audioObjects[region].night;
		} else {
			toPlay = audioObjects[region].day;
		}

		// Stop the audio object
		toPlay.pause();
	}
}


//////////////////////////////// HELPER RELATED STUFF ////////////////////////////////
// JankQuery 
function $id(id) {
	return document.getElementById(id);
}

// Positive only mod
function mod(n, m) {
  return ((n % m) + m) % m;
}
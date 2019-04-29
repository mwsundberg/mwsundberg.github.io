// Settings
let playing = false;
let locationAvailable = false;
const locationSettings = {
	enableHighAccuracy: true, 
	maximumAge        : 30000, 
	timeout           : 27000
};

// Variable storing location so no stutter when starting again
let lastLocation;

// Map Settings
const center = [43.12861, -77.630081];
const myLocationMarkerOptions = {
	weight: 3,
	color: '#fff',
	radius: 5,
	fillColor: '#009dff',
	fillOpacity: 1.0
};

// Map stuff
let mymap = L.map('mapid').setView(center, 16);
let myLocationMarker = L.circleMarker(L.latLng(center), myLocationMarkerOptions);

// Mapbox Light layer
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
	maxZoom: 18,
	minZoom: 14,
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
		'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	id: 'mapbox.light'
}).addTo(mymap);

// // Stamen Toner layer
// L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
// 	maxZoom: 18,
// 	minZoom: 14,
// 	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
// 		'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
// 		'Imagery © <a href="https://stamen.com">Stamen Design</a>'
// }).addTo(mymap);


myLocationMarker.addTo(mymap);

// // Onclick show lat/long
// let popup = L.popup();
// function onMapClick(e) {
// 	popup
// 		.setLatLng(e.latlng)
// 		.setContent('You clicked the map at ' + e.latlng.toString())
// 		.openOn(mymap);
// }
// mymap.on('click', onMapClick);

L.geoJson(geoJson).addTo(mymap);



// Geolocation API dealings
if ('geolocation' in navigator) {
	let watchID = navigator.geolocation.watchPosition(locationFound, locationUnavailable, locationSettings);
} else {
	locationAvailable = false;
	console.log('API not supported, sorry.');
}

// Location found (main function)
function locationFound(position) {
	locationAvailable = true;
	lastLocation = position;
	const latitude  = position.coords.latitude;
	const longitude = position.coords.longitude;
	const myLocationTurf = turf.point([longitude, latitude]);
	console.log('Got location: ' + latitude + ', ' + longitude);

	// Update map markers
	myLocationMarker.setLatLng(L.latLng(latitude, longitude));

	// Check each region and play audio
	geoJson.features.forEach(function(feature, i, array){
		let myAudio = feature.properties.audio;

		// If currently in this feature
		if(turf.booleanPointInPolygon(myLocationTurf, feature) && !feature.properties.playing){
			console.log('Detected audio zone ' + feature.properties.name + ".");

			if(playing){
				feature.properties.playing = true;
				myAudio.play();
			}

		} else if(!turf.booleanPointInPolygon(myLocationTurf, feature) && feature.properties.playing){
			if(playing){
				feature.properties.playing = false;
				myAudio.pause();
			}
		}
	});
}

// Location query failure
function locationUnavailable() {
	if(lastLocation == null){
		locationAvailable = false;
		console.log('Sorry, no position available.');
	} else {
		console.log('Failed to get new location, reusing old.');
	}
}

// Toggle Playable helper
function togglePlayable(){
	// Only do something if can
	if(locationAvailable) {
		playing = !playing;
		console.log('Toggled Playable.');
		let overlayClasses = document.getElementById('overlay').classList;

		// Playing
		if(playing){
			overlayClasses.remove("off");
			overlayClasses.add("on");

			// Update toggle text
			document.getElementById('toggle').innerHTML = '⏸';

			// Start audio
			if(location != null){
				locationFound(lastLocation);
			}
		} else { // Pausing
			overlayClasses.remove("on");
			overlayClasses.add("off");

			// Update toggle text
			document.getElementById('toggle').innerHTML = '▶';

			// Pause all audios
			geoJson.features.forEach(function(feature, i, array){
				feature.properties.playing = false;
				feature.properties.audio.pause();
			});
		}
	} else { // Location not available
		console.log("location unavailable.");
	}
}
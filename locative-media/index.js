// Settings
let playing = false;
let playedSomething = false;
let date = new Date();
let hour = date.getUTCHours() - date.getTimezoneOffset()/60;
let night = hour < 7 || hour > 9;
let nightOverride = (new URLSearchParams(window.location.search)).get('nightOverride');
let locationAvailable = false;
const locationSettings = {
	enableHighAccuracy: true, 
	maximumAge        : 30000, 
	timeout           : 27000
};

buildingRegions.features.forEach(function(feature, i, array){
		let audioOptions = audioLocations[feature.properties.region];

		if((night || nightOverride) && audioOptions.night != "" && audioOptions.night != undefined){
			feature.properties.audio = new Audio(audioOptions.night);
		} else if(audioOptions.day != "" && audioOptions.day != undefined){
			feature.properties.audio = new Audio(audioOptions.day);
		}
		if(feature.properties.audio != undefined){
			feature.properties.audio.addEventListener('ended', function() {
		    this.currentTime = 0;
		    this.play();
			}, false);
		}
});
generalRegions.features.forEach(function(feature, i, array){
		let audioOptions = audioLocations[feature.properties.region];

		if((night || nightOverride) && audioOptions.night != "" && audioOptions.night != undefined){
			feature.properties.audio = new Audio(audioOptions.night);
		} else if(audioOptions.day != "" && audioOptions.day != undefined){
			feature.properties.audio = new Audio(audioOptions.day);
		}
		if(feature.properties.audio != undefined){
			console.log("adding loop")
			feature.properties.audio.addEventListener('ended', function() {
		    this.currentTime = 0;
		    this.play();
			}, false);
		}
});

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



// // Onclick show lat/long
// let popup = L.popup();
// function onMapClick(e) {
// 	popup
// 		.setLatLng(e.latlng)
// 		.setContent('You clicked the map at ' + e.latlng.toString())
// 		.openOn(mymap);
// }
// mymap.on('click', onMapClick);

L.geoJson(generalRegions).addTo(mymap);
L.geoJson(buildingRegions).addTo(mymap);

myLocationMarker.addTo(mymap);


// Geolocation API dealings
if ('geolocation' in navigator) {
	let watchID = navigator.geolocation.watchPosition(locationFound, locationUnavailable, locationSettings);
} else {
	locationAvailable = false;
	console.log('API not supported, sorry.');
}

// Location found (main function)
function locationFound(position) {
	date = new Date();
	hour = date.getUTCHours() - date.getTimezoneOffset()/60;
	night = hour < 7 || hour > 9;

	locationAvailable = true;
	lastLocation = position;

	const latitude  = position.coords.latitude;
	const longitude = position.coords.longitude;
	const myLocationTurf = turf.point([longitude, latitude]);
	console.log('Got location: ' + latitude + ', ' + longitude);

	// Update map markers
	myLocationMarker.setLatLng(L.latLng(latitude, longitude));

	// Check each region and play audio
	playedSomething = false;
	buildingRegions.features.forEach(function(feature, i, array){
	let audioOptions = audioLocations[feature.properties.region];

	// If currently in this feature
	if(playing && turf.booleanPointInPolygon(myLocationTurf, feature)){
			console.log('Detected audio zone ' + feature.properties.region + ": ");

			if((night || nightOverride) && audioOptions.night != "" && audioOptions.night != undefined){
				feature.properties.audio = new Audio(audioOptions.night);
				feature.properties.audio.play();
				playedSomething = true;
			} else if(audioOptions.day != "" && audioOptions.day != undefined){
				feature.properties.audio = new Audio(audioOptions.day);
				feature.properties.audio.play();
				playedSomething = true;
			}

		} else {
			if(feature.properties.audio != undefined){
				feature.properties.audio.pause();
			}
		}
	});

	// Catchall case 
	generalRegions.features.forEach(function(feature, i, array){
	let audioOptions = audioLocations[feature.properties.region];

	// If currently in this feature
	if(playing && !playedSomething && turf.booleanPointInPolygon(myLocationTurf, feature)){
			console.log('Detected audio zone ' + feature.properties.region + ": ");

			if((night || nightOverride) && audioOptions.night != "" && audioOptions.night != undefined && !feature.properties.playing){
				feature.properties.audio = new Audio(audioOptions.night);
				feature.properties.audio.play();
				feature.properties.playing = true;
				playedSomething = true;
			} else if(audioOptions.day != "" && audioOptions.day != undefined && !feature.properties.playing){
				feature.properties.audio = new Audio(audioOptions.day);
				feature.properties.audio.play();
				feature.properties.playing = true;
				playedSomething = true;
			}

		} else {
			if(feature.properties.audio != undefined){
				feature.properties.audio.pause();
				feature.properties.playing = false;
			}
		}
	});
}

// Location query failure
function locationUnavailable() {
	if(lastLocation == undefined){
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
			buildingRegions.features.forEach(function(feature, i, array){
					feature.properties.audio.pause();
					feature.properties.playing = false;
			});
			generalRegions.features.forEach(function(feature, i, array){
					feature.properties.audio.pause();
					feature.properties.playing = false;
			});
		}
	} else { // Location not available
		console.log("location unavailable.");
	}
}
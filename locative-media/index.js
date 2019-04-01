function cantGetCoordinates() {
  alert("Sorry, no position available.");
}

var locationSettings = {
  enableHighAccuracy: true, 
  maximumAge        : 30000, 
  timeout           : 27000
};

let mapLink = document.getElementById('mapLink')

function queryLocationAndPlayAudio(location){
	// Check each region
	for(let i = 0; i < geoJson.features.length; i++){
		let feature = geoJson.features[i];
		let myAudio = feature.properties.audio;

		// If currently in this feature
		if(turf.booleanPointInPolygon(location, feature)){
			console.log('Detected audio zone ' + feature.properties.name + ".");
			feature.properties.playing = true;

			// https://stackoverflow.com/a/3273566
			myAudio.addEventListener('ended', function() {
			    this.currentTime = 0;
			    this.play();
				}, false);
			myAudio.play();
			if(feature.properties.name == "wilder"){
				document.getElementById("header").innerHTML = "April fools.";
			}
		} else {
			if(feature.properties.name != "wilder"){
				document.getElementById("header").innerHTML = "Wander around Jackson Court and the hill area to experience this piece."
			}
			myAudio.pause();

			feature.properties.playing = false;
		}

		geoJson.features[i] = feature;
	}
}

if ("geolocation" in navigator) {
  let watchID = navigator.geolocation.watchPosition(function(position) {
  	const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;

	  queryLocationAndPlayAudio(turf.point([longitude, latitude]));
	  console.log('updated location: ' + latitude + ', ' + longitude);
	  mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;

	}, cantGetCoordinates, locationSettings);
} else {
  alert("API not supported, sorry.");
}
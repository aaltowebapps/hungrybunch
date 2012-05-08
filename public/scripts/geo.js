(function(FeedMe) {
	// Position
	var position;
	// Position options accuracy
	var position_high_accuracy = true;
	// Position options max age of reading in milliseconds
	var position_max_age = 30000;
	// Position options maximum timeout in milliseconds
	var position_timeout = 27000;
	// Position watch id
	var position_watch_id = null;

	var GEOLOCATION_POSITION_ERROR = 'geolocationChangeErrorEvent';
	var GEOLOCATION_POSITION_SUCCESS = 'geolocationChangeSuccessEvent';

	var calculateDistance = function(lat1,lon1,lat2,lon2) {
		var R = 6371; // km (change this constant to get miles)
		var dLat = (lat2-lat1) * Math.PI / 180;
		var dLon = (lon2-lon1) * Math.PI / 180;
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c;

		return d;
	};

	// Check online
	var isOnline = function() {
		return navigator.onLine;
	};

	// Check geolocation support
	var haveGeoSupport = function() {
		return navigator.geolocation;
	};

	// Get current position
	var currentPosition = function() {
		navigator.geolocation.getCurrentPosition(geoSuccess, geoError, 
			{enableHighAccuracy: position_high_accuracy, maximumAge: position_max_age, timeout: position_timeout});
	};

	// Start tracking position changes
	var trackPositionChanges = function() {
		if (position_watch_id == null) {
			position_watch_id = navigator.geolocation.watchPosition(geoSuccess, geoError, 
				{enableHighAccuracy: position_high_accuracy, maximumAge: position_max_age, timeout: position_timeout});
		}
	};

	// Stop tracking position changes
	var stopTrackPositionChanges = function() {
		if (position_watch_id != null) {
			navigator.geolocation.clearWatch(position_watch_id);
			position_watch_id = null;
		}
	};

	// Successful geolocation update
	var geoSuccess = function(newPosition) {
		//$('body').trigger(GEOLOCATION_POSITION_SUCCESS, {position: position});
		FeedMe.geo.position = newPosition;
		console.log("Got position:", newPosition);

		var lat = newPosition.coords.latitude;
		var lng = newPosition.coords.longitude;
		// Update distances to model data
		FeedMe.restaurantsData.each(function(item, index){
			var itemLat = item.get('location').lat;
			var itemLng = item.get('location').lng;
			var distance = null;
			if( itemLat && itemLng ) {
				distance = calculateDistance(lat, lng, itemLat, itemLng);
			}
			item.set({distance: distance});
		});
	};

	// Geolocation error
	var geoError = function(error) {
	    // error.code can be:
	    //   0: unknown error
	    //   1: permission denied
	    //   2: position unavailable (error response from locaton provider)
	    //   3: timed out
	    $('body').trigger(GEOLOCATION_POSITION_ERROR, {error: error.code});
		console.log("Geolocation error occurred. Error code: " + error.code);
	};

	FeedMe.geo = {
		isOnline : isOnline,
		haveGeoSupport : haveGeoSupport,
		calculateDistance : calculateDistance,
		position : null
	};

	// When document is ready, get position
	$(document).ready(function() {
		currentPosition();
	});

})(FeedMe);
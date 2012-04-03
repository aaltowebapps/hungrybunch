//
// FeedMe! Javascript busines logic main file
// by Johannes Niemelä and rest of the Hungry Bunch
//

// Api related constants
var api_url = "http://www.lounasaika.net/api/";
var api_req_key = "development321";
var api_req_callback = "?callback=?";
var api_req_campus = "";
var api_req_restaurant = "";
var api_req_lat = null;
var api_req_lng = null;
var api_req_maxdistance = null;
var api_res_output = "json";
var api_res_root = "LounasaikaResponse";
var api_res_status = "status";
var api_res_ok = "OK";
var api_res_result = "result";
var api_res_updated = "updated";
var api_res_campus = "campus";
var api_res_name = "name";
var api_res_restaurant = "restaurant";
var api_res_url = "url";
var api_res_info = "info";
var api_res_location = "location";
var api_res_address = "address";
var api_res_lat = "lat";
var api_res_lng = "lng";
var api_res_distance = "distance";
var api_res_opening_hours = "opening_hours";
var api_res_opening_time = "opening_time";
var api_res_closing_time = "closing_time";
var api_res_monday = "monday";
var api_res_tuesday = "tuesday";
var api_res_wednesday = "wednesday";
var api_res_thursday = "thursday";
var api_res_friday = "friday";
var api_res_saturday = "saturday";
var api_res_sunday = "sunday";
var api_res_menu = "menu";
var api_res_meal = "meal";

// Local storage related constants
var localStorage_key = "menuOnWeek";

// Array to store restaurants data
var restaurants = new Array();

// Expand Date to include function for getting a week number.
Date.prototype.getWeek = function() {
	var onejan = new Date(this.getFullYear(),0,1);
	return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

// Successful fetch response is handled here
function success(responseData) {
	if (responseData) {
		var status = responseData[api_res_root][api_res_status];
		if (status == api_res_ok) {
			// Response OK
			var updated = responseData[api_res_root][api_res_result][api_res_updated];
			// Parse date and time from 2012-03-25T21:55:09+03:00
			// Compare to date time on device
			// Store campi to localstore with expiration at the very beginning of next week
			var campi = responseData[api_res_root][api_res_result][api_res_campus];
			restaurants = new Array();
			$.each(campi, function(index, value) {
    			//alert(index + ': ' + value[api_res_name]);
    			var campus = campi[index][api_res_name];
    			var res_restaurants = value[api_res_restaurant];
				$.each(res_restaurants, function(index, value) {
    				var restaurant = value;
    				restaurant['campus'] = campus;
    				restaurants.push(restaurant);
    				//alert(value[api_res_name])
    			});
			});

			var key = getKeyOfThisWeek();
			// Have to calculate the minutesToNextWeek for expiration time of cache
			// lscache.set(key, campi, minutesToNextWeek);
			// for now just use it without expiration time
			lscache.set(key, restaurants);
		} else {
			// Response not OK
		}
	}
}

// Fetch data
function fetchMenus() {
	var data = { key: api_req_key };
	var url = api_url + api_res_output + api_req_callback;
	// Use sample data
	// $.getJSON('assets/sampledata/sampleresponse.js', success);
	// Actual get request, does not work on Chorme when using local html file.
	$.getJSON(url, data, success);
}

// Process loaded menus from local store
function processLoadedMenus(restaurantsFromCache) {
	restaurants = restaurantsFromCache;
}

// Returns key used to store weekly data in local storage
// Like "menuOnWeek24"
function getKeyOfThisWeek() {
	var today = new Date();
	var weekNumber = today.getWeek();
	var key = localStorage_key + weekNumber.toString();
	return key;
}

// Initialize data
function init() {
	var key = getKeyOfThisWeek();
	// This is for development, you can flush cache from local storage to force
	// fetching of fresh data by uncommentting next line.
	// lscache.flush();
	// Try to load menu from local storage
	var restaurantsFromCache = lscache.get(key);
	if (restaurantsFromCache) {
		// If loaded from local storage, process it
		processLoadedMenus(restaurantsFromCache);
	} else {
		// Data not available or is expired on local storage, we have to fetch it
		// Should be checked for available connection, device online
		fetchMenus();
		// If connection is not availble, inform user that connection is needed.
	}
}

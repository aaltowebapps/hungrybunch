// Self-invoking function, closure
(function(FeedMe) {
	
	// Temporary test data
	var restaurantsTestData = {
		1: { 
			id : 1, 
			name : 'Taffa', 
			menu : [
				{ day: 'monday',  meal: ['Meal A for #1', 'Meal B for #1']}, 
				{ day:'tuesday', meal: ['Tuesday meal']}
			]},
		2: { 
			id : 2, 
			name : 'Teekkariravintolat', 
			menu : [
				{ day: 'monday', meal : ['Meal A for #2', 'Meal B for #2']}
			]},
		3: { id : 3, name : 'Kvarkki', menu : [{ day: 'monday', meal : ['Meal A for #3', 'Meal B for #3']}]},
		4: { id : 4, name : 'Cantina', menu : [{ day : 'monday', meal : ['Meal A for #4', 'Meal B for #4']}]},
		5: { id : 5, name : 'TUAS', menu : [{ day : 'monday', meal : ['Meal A for #5', 'Meal B for #5']}]}
	}
	
	// Set test data to local storage
	//localStorage.setItem("RestaurantsTestBySami", JSON.stringify(restaurantsTestData));

	// TODO: Something like
	//fetchDataFromApi();



	var fixgeometry = function() {
	  scroll(0, 0);

	  /* Calculate the geometry that our content area should take */
	  var header = $(".header:visible");
	  var footer = $(".footer:visible");
	  var content = $(".content:visible");
	  var viewport_height = $(window).height();
	  
	  var content_height = viewport_height - header.outerHeight() - footer.outerHeight();
	  
	  /* Trim margin/border/padding height */
	  content_height -= (content.outerHeight() - content.height());
	  content.height(content_height);
	}; /* fixgeometry */

	// The earliest possible time to start the app, is when DOM is ready
	$(document).ready(function() {
		// When everything is ready, start app
		FeedMe.startApp = function(event) {

			//$(window).bind("orientationchange resize pageshow", fixgeometry);
			console.log("Is api ready?",FeedMe.lounasaikaApi.isReady);

			if( FeedMe.lounasaikaApi.isReady === true && FeedMe.isStarted !== true ) {

				// Set backbone localStorage here to make sure data in local storage is ready
				FeedMe.RestaurantsCollection = FeedMe.RestaurantsCollection.extend({
					localStorage : new Backbone.LocalStorage(FeedMe.lounasaikaApi.localstorageKey)
				})

				// Only start once
				FeedMe.isStarted = true;
				//Instantiate the collection of restaurants
				FeedMe.restaurantsData = new FeedMe.RestaurantsCollection();

				// Fetch restaurant data to model
				FeedMe.restaurantsData.fetch();

				// Create app routing
				FeedMe.app = new FeedMe.AppRouter();

				// Start backbone page history
				Backbone.history.start();

			}
		};

		// If api data is already handled, start app immediately
		if( FeedMe.lounasaikaApi.isReady === true) {
			FeedMe.startApp();
		} 
		// Otherwise will be started from the api functions
	})
})(FeedMe);

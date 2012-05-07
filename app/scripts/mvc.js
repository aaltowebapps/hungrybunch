// Self-invoking function, closure
(function(FeedMe) {

	// Source HTML for common footer
	var footerTemplateSource   = $("#footerTemplate").html();
	// Parse templates and set visible to FeedMe-object
	var restaurantsTemplate = Handlebars.compile($("#restaurantsTemplate").html() + footerTemplateSource);
	var menuTemplate = Handlebars.compile($("#menuTemplate").html() + footerTemplateSource);

	// Model for a single restaurant
	var RestaurantModel = Backbone.Model.extend ({
	  id : 0,
	  campus : '',
	  info : '',
	  location : {},
	  menu : {},
	  name : '',
	  opening_hours : {},
	  url : ''
	});

	// Collection for all restaurants
	var RestaurantsCollection = Backbone.Collection.extend ({
	  model: RestaurantModel
//	  localStorage: new Backbone.LocalStorage(FeedMe.lounasaikaApi.localstorageKey)
	});

	// View for the list of restaurants
	var RestaurantsView = Backbone.View.extend({
		// Compiled template
		template: restaurantsTemplate,
		// This is how the list of restaurants should be rendered to page
	    render:function (eventName) {
	    	console.log("Rendering restaurants view", this.collection);
	        $(this.el).html(this.template({'restaurants': this.collection.toJSON()}));
	        return this;
	    }
	});

	// View for the list of menus for a chosen restaurant
	var MenuView = Backbone.View.extend({
		// Compiled template
		template: menuTemplate,
		// This is how the menu listing should be rendered to page
	    render:function (eventName) {
	    	// Here we get the selected restaurant id and can select data for template accordingly

	    	// TODO: Determine next and previous pages, not necessary +-1 id
	    	var restaurantId = parseInt(this.options.restaurantId)-1;
	    	var baseUrl = "#/menus/";
	    	var prevRestaurantUrl = ( restaurantId <= 0 ? '#' : baseUrl + (restaurantId));
			var nextRestaurantUrl = baseUrl + (restaurantId+2);
	    	var restaurant = this.collection.models[restaurantId].toJSON();
			
	        $(this.el).html(this.template({'restaurant': this.collection.models[restaurantId].toJSON(), 'nextRestaurantUrl':nextRestaurantUrl, 'prevRestaurantUrl':prevRestaurantUrl})).ready( function() {
				var latlng = new google.maps.LatLng(restaurant.location.lat, restaurant.location.lng);
				var myOptions = {
					zoom: 16,
					center: latlng,
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};
				var map = new google.maps.Map(document.getElementById("canvas_map"), myOptions);				
				var marker = new google.maps.Marker({
					map: map,
					position: latlng, 
					draggable: true
				});			
			});
			return this;
	    }
	});

	// Define logic for routing
	var AppRouter = Backbone.Router.extend({

		// Map urls to pages
	    routes:{
	        "":"restaurants",
	        "/menus/:id":"menu"
	    },

	    initialize:function () {
	    	// Define sliding direction
	    	this.goReverse = false;

	    	var router = this;
	        
	        // Handle back button throughout the application
	        $('.back').live('click', function(event) {
	            window.history.back();
	            router.goReverse = true;
	            return false;
	        });

	        // When button with class .ui-btn-left is clicked, go reverse
	        $('.ui-btn-left').live('click', function(event) {
	        	router.goReverse = true;
	        });

	        // If swipe left is detected, go reverse and try to figure previous page
	        $('body').live('swipeleft', function(event) {
	        	router.goReverse = true;
	        	// TODO move to prevous page
	        	console.log('Detected swipe left');
	        });

	        // If swipe right is detected, go reverse and try to figure next page
	        $('body').live('swiperight', function(event) {
	        	// TODO move to next page
	        	console.log('Detected swipe right');
	        });

	        // We are on first pageload until marked otherwise
	        this.firstPage = true;
	    },

	    // Page restaurants (listing of all restaurants)
	    restaurants:function () {
	        this.changePage(new RestaurantsView({collection: FeedMe.restaurantsData}));
	    },

	    // Page menu (listing of menus for a restaurant)
	    menu:function (id) {
	        this.changePage(new MenuView({collection: FeedMe.restaurantsData, restaurantId:id}));
	    },

	    // This is how changing a page is handled
	    changePage:function (page) {
	        $(page.el).attr('data-role', 'page');			
	        $('body').append($(page.el));
	    	// Render page
	        page.render();
	        // Add new page to document body

	        var transition = 'slide';
	        // We don't want to slide the first page
	        if (this.firstPage) {
	            transition = 'none';
	            this.firstPage = false;
	        }

	        // Go reverse this time?
	        var reverse = false;
	        if( this.goReverse ) {
	        	reverse = true;
	        	this.goReverse = false;
	        }
	        
	        // Finally change page
	        $.mobile.changePage($(page.el), {changeHash:false, transition: transition, reverse: reverse});
	    }

	});

	// Make public only what needs to be globally available
	FeedMe.RestaurantModel = RestaurantModel;
	FeedMe.RestaurantsCollection = RestaurantsCollection;
	FeedMe.RestaurantsView = RestaurantsView;
	FeedMe.MenuView = MenuView;
	FeedMe.AppRouter = AppRouter;



})(FeedMe);

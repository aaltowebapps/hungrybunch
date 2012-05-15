// Self-invoking function, closure
(function(FeedMe) {

	Handlebars.registerHelper('distance_formatted', function() {
		var d = this.distance;
		var output;
		if(!d) 
			output = "?";
		else if (d>1) 
			output = Math.round(d)+" km";
		else if (d<=1) 
			output = Math.round(d*1000)+" m";
		else
			output = "";
	  return new Handlebars.SafeString(output);
	});

	// Source HTML for common footer
	var footerTemplateSource   = $("#footerTemplate").html();
	// Parse templates and set visible to FeedMe-object
	var restaurantItemTemplate = Handlebars.compile($("#restaurantItemTemplate").html());
	var restaurantsListTemplate = Handlebars.compile($("#restaurantsListTemplate").html());
	var restaurantsPageTemplate = Handlebars.compile($("#restaurantsPageTemplate").html() + footerTemplateSource);
	var menuTemplate = Handlebars.compile($("#menuTemplate").html() + footerTemplateSource);
	var mapTemplate = Handlebars.compile($("#mapTemplate").html() + footerTemplateSource);

	// Model for a single restaurant
	var RestaurantModel = Backbone.Model.extend ({
		id : 0,
		initialize : function() {
			// If user position is known, calculate distance
			if(FeedMe.geo.position) {
				this.updateDistance(FeedMe.geo.position.coords.latitude, FeedMe.geo.position.coords.longitude);
			}
		},
		distanceFormatted : function() {
		  	var d = this.get('distance');
			if (d>1) return Math.round(d)+" km";
			else if (d<=1) return Math.round(d*1000)+" m";
			return d;
		},
	  	updateDistance : function(lat,lng) {
	  		if( lat && lng ) {
				var itemLat = this.get('location').lat;
				var itemLng = this.get('location').lng;
				var distance = null;
				if( itemLat && itemLng ) {
					distance = FeedMe.geo.calculateDistance(lat, lng, itemLat, itemLng);
				}
				this.set({distance: distance});
	  		}
		}
	});

	// Collection for all restaurants
	var RestaurantsCollection = Backbone.Collection.extend ({
		model: RestaurantModel,
//	  localStorage: new Backbone.LocalStorage(FeedMe.lounasaikaApi.localstorageKey)
		comparator: function(item){
        	return item.get('distance') || 9999999999;
      	}
	});

	// View for a single restaurant in list
	var RestaurantItemView =  Backbone.View.extend({
		tagName: "li",
		initialize: function() { 
			// Let's not bind to changes on rows, but on the entire collection instead
            //this.model.bind('change', this.render, this);
            this.template = restaurantItemTemplate;  
        },
        render: function() { 
            $(this.el).html( this.template(this.model.toJSON()) );
            return this; 
        }
	});


	// View for the list of restaurants
	var RestaurantsListView = Backbone.View.extend({
		initialize: function() { 
            this.collection.bind('change', this.debouncedRender, this);
            this.template = restaurantsListTemplate;
        },
        debouncedRender : _.debounce(function() {
        	// Force sorting the collection before re-rendering
        	this.collection.sort();
			this.render();

			// As we created a new list, jQuery Mobile needs to render it to listview now
			$(this.el).find('#restaurantsList').listview({
			  autodividers: true,
			  autodividersSelector: function ( li ) {
			    return $(li).find('a').attr('title').text();
			  }
			});
			$(this.el).find('#restaurantsList').listview('refresh');
		}, 300),
		// This is how the list of restaurants should be rendered to page
	    render:function (eventName) {
	    	var $el = $(this.el).empty();
	        $el.html(this.template({'restaurants': this.collection.toJSON(), chosenRestaurant:FeedMe.chosenRestaurant}));
	        var $list = $el.find('#restaurantsList');
	        this.collection.each(function(item) {
		        var itemView = new RestaurantItemView({model: item});
		        $list.append(itemView.render().el);
	        });
	        
	        return this;
	    }
	});


	// View for the restaurants page
	var RestaurantsView = Backbone.View.extend({
		initialize: function() { 
            this.template = restaurantsPageTemplate;
        },
	    render:function (eventName) {
		    var listView = new RestaurantsListView({collection: this.collection});

			var $el = $(this.el).empty();
	    	$el.html(this.template());
	    	$el.find('#restaurantsListWrapper').append(listView.render().el);

	        return this;
	    }
	});

	var previousRestaurant = 0;
	var nextRestaurant = 0;

	// View for the list of menus for a chosen restaurant
	var MenuView = Backbone.View.extend({
		// Compiled template
		template: menuTemplate,
		// This is how the menu listing should be rendered to page
	    render:function (eventName) {
	    	// Here we get the selected restaurant id and can select data for template accordingly

	    	var currentRestaurantId = parseInt(this.options.restaurantId);
	    	var currentModel = FeedMe.restaurantsData.get(currentRestaurantId);
	    	var index = this.collection.indexOf(currentModel);
			previousRestaurant = this.collection.at(index-1);
			nextRestaurant = this.collection.at(index+1);

	    	var baseUrl = "#/menus/";
	    	var prevRestaurantUrl = ( previousRestaurant ? baseUrl + previousRestaurant.id : '#');
	    	var nextRestaurantUrl = ( nextRestaurant ? baseUrl + nextRestaurant.id : '#');

	    	var prevLabel = previousRestaurant ? previousRestaurant.get('name') : 'Restaurants';
	    	var nextLabel = nextRestaurant ? nextRestaurant.get('name') : 'Restaurants';

	    	var restaurant = currentModel.toJSON();

			var mapParameters = 'center='+restaurant.location.lat+','+restaurant.location.lng+'&zoom=13&size='+($(document).width()-30)+'x100&sensor=true&markers='+restaurant.location.lat+','+restaurant.location.lng;

	        $(this.el).html(this.template({'restaurant': restaurant, 'nextRestaurantUrl':nextRestaurantUrl, 'prevRestaurantUrl':prevRestaurantUrl, 'chosenRestaurant':FeedMe.chosenRestaurant, 'prevLabel':prevLabel, 'nextLabel':nextLabel, 'mapParameters':mapParameters}));
			return this;
	    }
	});

	// View for the map page
	var MapView = Backbone.View.extend({
		initialize: function() { 
            this.template = mapTemplate;
        },
	    render:function (eventName) {	
	    	$(this.el).html(this.template({'chosenRestaurant':FeedMe.chosenRestaurant}));

	    	// TODO: Set map element "#canvas_map" to full screen size
	    	$(this.el).find('#canvas_map').width($(document).width());
	    	$(this.el).find('#canvas_map').height($(document).height()-100);

	    	var userPosition = null;
	    	var userMarker = null;
	    	if( FeedMe.geo.position && FeedMe.geo.position.coords ) {
	    		userPosition = new google.maps.LatLng(FeedMe.geo.position.coords.latitude, FeedMe.geo.position.coords.longitude);
	    	} else {
	    		userPosition = new google.maps.LatLng(60.167091,24.943557);
	    	}

	

    		// TODO: bind event listener for user position and set new position when changed

			var myOptions = {
				zoom: 16,
				center: userPosition,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			var map = new google.maps.Map(document.getElementById("canvas_map"), myOptions);	
			FeedMe.map = map;
	    	// TODO: Draw user position on map as a dot or something different from the restaurant markers
			var userMarker = new google.maps.Marker({
				map: map,
				position: userPosition, 
				draggable: false,
				title: 'Your position'
			});

			// Draw restaurant as markers on map
    		var markers = [];
    		FeedMe.restaurantsData.each(function(item) {
    			var location = item.get('location');
    			if( location && location.lat && location.lng ) {
    				var latlng = new google.maps.LatLng(location.lat, location.lng);
					var marker = new google.maps.Marker({
						url: '#/menus/'+item.get('id'),
						map: map,
						position: latlng, 
						draggable: false,
						title: item.get('name'),
						icon: 'images/restaurant.png'
					});
					google.maps.event.addListener(marker, 'click', function() {
						window.location.href = marker.url;
					});			
			    	
					markers.push(marker);
				}   
	        }); 

			// TODO: Smarter binding and unbinding
			$(document).on('pageshow.mapview', function() {
				google.maps.event.trigger(FeedMe.map,'resize');
				map.setCenter(userPosition);
				$(document).off('pageshow.mapview');
			});

	        return this;
	    }
	});
	// Define logic for routing
	var AppRouter = Backbone.Router.extend({

		// Map urls to pages
	    routes:{
	        "":"restaurants",
	        "/menus/:id":"menu",
	        "/lastmenu/":"lastmenu",
	        "/map/":"map"
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

	        // If swipe right is detected, go reverse and try to figure previous page
	        $('body').live('swiperight', function(event) {
	        	if( router.currentPageName == 'menu') {
	        		if( previousRestaurant ) {
	        			router.goReverse = true;
	        			router.menu(previousRestaurant.id);
	        		} else {
	        			router.restaurants();
	        		}
	        	}
	        	// TODO move to prevous page
	        	//console.log('Detected swipe left');
	        });

	        // If swipe left is detected, go to the next page
	        $('body').live('swipeleft', function(event) {
	        	if( router.currentPageName == 'menu') {
	        		if( nextRestaurant ) {
		        		router.goReverse = false;
	        			router.menu(nextRestaurant.id);
	        		}
	        	}
	        	// TODO move to next page
	        	//console.log('Detected swipe right');
	        });

	        // We are on first pageload until marked otherwise
	        this.firstPage = true;
	    },

	    // Page restaurants (listing of all restaurants)
	    restaurants:function () {
			this.currentPageName = 'restaurants';
	    	var view = new RestaurantsView({collection: FeedMe.restaurantsData});

	        this.changePage(view, 'slideup');
	        window.view = view;

	    },

	    // Page menu (listing of menus for a restaurant)
	    menu:function (id) {
	        FeedMe.chosenRestaurant = id;
	        this.currentPageName = 'menu';
	        this.currentRestaurant = id;
	        this.changePage(new MenuView({collection: FeedMe.restaurantsData, restaurantId:id}), 'slide');
	    },
	    lastmenu:function() {
	    	this.currentPageName = 'menu';
		    this.changePage(new MenuView({collection: FeedMe.restaurantsData, restaurantId: this.currentRestaurant ? this.currentRestaurant : 1}), 'slideup');
	    },

	    map:function () {
	        this.currentPageName = 'map';
	        this.changePage(new MapView(), 'slideup');
	    },

	    // This is how changing a page is handled
	    changePage:function (page, transition) {
	        $(page.el).attr('data-role', 'page');			
	        // Add new page to document body
	        $('body').append($(page.el));
	    	// Render page
	        page.render();

	        //var transition = 'slide';
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

// Self-invoking function, closure
(function(FeedMe) {

	Handlebars.registerHelper('distance_formatted', function() {
		var d = this.distance;
		var output;
		if(!d) 
			output = "*";
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
		/* */
	  id : 0,

	  /* */
	  distanceFormatted : function() {
	  	var d = this.get('distance');
		if (d>1) return Math.round(d)+" km";
		else if (d<=1) return Math.round(d*1000)+" m";
		return d;
	  }
	});

	// Collection for all restaurants
	var RestaurantsCollection = Backbone.Collection.extend ({
		model: RestaurantModel,
//	  localStorage: new Backbone.LocalStorage(FeedMe.lounasaikaApi.localstorageKey)
		comparator: function(item){
        	return item.get('distance');
      	}
	});

	var refreshListView = _.debounce(function() {
		//$('#restaurantsList').listview('refresh');
	}, 300);
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

            console.log("Rendered item: "+this.cid);

            return this; 
        }
	});


	// View for the list of restaurants
	var RestaurantsListView = Backbone.View.extend({
		// Compiled template
		//template: restaurantsListTemplate,
		initialize: function() { 
            this.collection.bind('change', this.debouncedRender, this);
            this.template = restaurantsListTemplate;
        },
        debouncedRender : _.debounce(function() {
			this.render();
			// As we created a new list, jQuery Mobile needs to render it to listview now
			$(this.el).find('#restaurantsList').listview();
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
	        console.log("Rendered list");
	        

	        // TODO: Lazily update page with .page()?
	        // TODO: Create/update listview with .listview() or .listview('refresh')?
	        
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

	    	console.log('Rendered restaurants page');
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
			
	        $(this.el).html(this.template({'restaurant': this.collection.models[restaurantId].toJSON(), 'nextRestaurantUrl':nextRestaurantUrl, 'prevRestaurantUrl':prevRestaurantUrl, 'chosenRestaurant':FeedMe.chosenRestaurant}))
	        .ready( function() {
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

	// View for the list of menus for a chosen restaurant
	var MapView = Backbone.View.extend({
		initialize: function() { 
            this.template = mapTemplate;
        },
	    render:function (eventName) {	
	    	$(this.el).html(this.template({'chosenRestaurant':FeedMe.chosenRestaurant}));        
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
	        		if( router.currentRestaurant > 1) {
	        			router.goReverse = true;
	        			router.menu(currentRestaurant - 1);
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
	        		router.goReverse = true;
	        		if( router.currentRestaurant < FeedMe.restaurantsData.length ) {
	        			router.menu(currentRestaurant + 1);
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
/*
	        $('#restaurantsList').listview({
			  autodividers: true,

			  // the selector function is passed a <li> element from the listview;
			  // it should return the appropriate divider text for that <li>
			  // element as a string
			  autodividersSelector: function ( li ) {
			  	alert("there");
			    return $(li).find('campus').text();
			  }
			});
*/
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
		    this.changePage(new MenuView({collection: FeedMe.restaurantsData, restaurantId:this.currentRestaurant}), 'slideup');
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
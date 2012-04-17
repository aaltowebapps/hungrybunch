(function() {

	var RestaurantModel = Backbone.Model.extend ({
	  id : 0,
	  name : '',
	  menu : []
	});

	var RestaurantsCollection = Backbone.Collection.extend ({
	  model: RestaurantModel,
	  localStorage: new Backbone.LocalStorage("RestaurantsTestBySami")
	});

	var RestaurantsView = Backbone.View.extend({
		template: restaurantsTemplate,
	    render:function (eventName) {
	    	
	        $(this.el).html(this.template({'restaurants': this.collection.toJSON()}));

	        return this;
	    }
	});

	var MenuView = Backbone.View.extend({
		template: menuTemplate,
	    render:function (eventName) {
	    	// Here we get the selected restaurant id and can select data for template accordingly

	    	// TODO: Clean up
	    	var restaurantId = parseInt(this.options.restaurantId)-1;
	    	var baseUrl = "#/menus/";

	    	var prevRestaurantUrl = ( restaurantId <= 0 ? '#' : baseUrl + (restaurantId));
			var nextRestaurantUrl = baseUrl + (restaurantId+2);
	    	
	        $(this.el).html(this.template({'restaurant': this.collection.models[restaurantId].toJSON(), 'nextRestaurantUrl':nextRestaurantUrl, 'prevRestaurantUrl':prevRestaurantUrl}));

	        return this;
	    }
	});

	var AppRouter = Backbone.Router.extend({

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
	        $('.ui-btn-left').live('click', function(event) {
	        	router.goReverse = true;
	        });

	        this.firstPage = true;
	    },

	    restaurants:function () {
	        
	        this.changePage(new RestaurantsView({collection: restaurantsData}));

	    },

	    menu:function (id) {
	        
	        this.changePage(new MenuView({collection: restaurantsData, restaurantId:id}));
	    },

	    changePage:function (page) {
	    	
	        $(page.el).attr('data-role', 'page');
	        page.render();
	        $('body').append($(page.el));
	        var transition = 'slide';
	        // We don't want to slide the first page
	        if (this.firstPage) {
	            transition = 'none';
	            this.firstPage = false;
	        }

	        var reverse = false;
	        if( this.goReverse ) {
	        	reverse = true;
	        	this.goReverse = false;
	        }
	        
	        $.mobile.changePage($(page.el), {changeHash:false, transition: transition, reverse: reverse});
	    }

	});

	// Make public only what needs to be globally available
	window.RestaurantModel = RestaurantModel;
	window.RestaurantsCollection = RestaurantsCollection;
	window.RestaurantsView = RestaurantsView;
	window.MenuView = MenuView;
	window.AppRouter = AppRouter;

})();

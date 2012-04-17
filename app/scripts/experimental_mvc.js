// Models

var RestaurantModel = Backbone.Model.extend ({
  id : 0,
  name : '',
  menu : []
});
var RestaurantsCollection = Backbone.Collection.extend ({
  model: RestaurantModel,
  localStorage: new Backbone.LocalStorage("RestaurantsTestBySami")
});

// Views

window.RestaurantsView = Backbone.View.extend({

    //template:_.template($('#restaurants').html()),

//			    template:restaurantsTemplate,
	template : function() {},
    render:function (eventName) {
    	
        $(this.el).html(this.template({'restaurants': this.collection.toJSON()}));

        return this;
    }
});

window.MenuView = Backbone.View.extend({
    //template:_.template($('#menu').html()),
//			    template:menuTemplate,
	template : function() {},
    render:function (eventName) {
    	// Here we get the selected restaurant id and can select data for template accordingly

    	// TODO: Clean up
    	var restaurantId = parseInt(this.options.restaurantId)-1;
    	var baseUrl = "#/menus/";

    	var prevRestaurantUrl = ( restaurantId <= 0 ? '#' : baseUrl + (restaurantId));
		var nextRestaurantUrl = baseUrl + (restaurantId+2);
    	
    	//var output = _.template($('#menu').html(), {restaurant: restaurants[restaurantId]});
        //$(this.el).html(output);

        $(this.el).html(this.template({'restaurant': this.collection.models[restaurantId].toJSON(), 'nextRestaurantUrl':nextRestaurantUrl, 'prevRestaurantUrl':prevRestaurantUrl}));
        console.log("Chosen restaurant model: ",this.collection.models[restaurantId].toJSON())
        return this;
    }
});

// Routers
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

        this.firstPage = true;
    },

    restaurants:function () {
        this.changePage(new RestaurantsView({collection: AppData.restaurants}));
        console.log(AppData.restaurants);
    },

    menu:function (id) {
        this.changePage(new MenuView({collection: AppData.restaurants, restaurantId:id}));
    },

    changePage:function (page) {
    	
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        var transition = $.mobile.defaultPageTransition;
        // We don't want to slide the first page
        if (this.firstPage) {
            transition = 'none';
            this.firstPage = false;
            console.log("firstPage");
        }

        var reverse = false;
        if( this.goReverse ) {
        	reverse = true;
        	this.goReverse = false;
        }
        
        $.mobile.changePage($(page.el), {changeHash:false, transition: transition, reverse: reverse});
        console.log("Change page: ", $(page.el));
    }

});

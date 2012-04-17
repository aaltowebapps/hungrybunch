var app;
var restaurants;

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
localStorage.setItem("RestaurantsTestBySami", JSON.stringify(restaurantsTestData));

// TODO: Something like
//fetchDataFromApi();

var FooterTemplateSource   = $("#footerTemplate").html();

var restaurantsTemplateSource   = $("#restaurantsTemplate").html() + FooterTemplateSource;
window.restaurantsTemplate = Handlebars.compile(restaurantsTemplateSource);

var menuTemplateSource   = $("#menuTemplate").html() + FooterTemplateSource;
window.menuTemplate = Handlebars.compile(menuTemplateSource);


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



$(document).ready(function () {
//$(window).bind("orientationchange resize pageshow", fixgeometry);

//Instantiate the collection of restaurants
	restaurants = new RestaurantsCollection();
	restaurants.fetch();

// Create routing
app = new AppRouter();
Backbone.history.start();

});

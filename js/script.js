var $wikiArticles = [];
var $nytmArticles = [];

//Data Model, limit to 10 to prevent NY Times API call error
var initialLocs = [
	{	id: 0,
		name: 'Webster Hall',
		lat: '40.731777',
		lng: '-73.989132',
		nicknames: ['Music', ' Club']
	},
	{	id: 1,
		name: 'Blue Note',
		lat: '40.731650', 
		lng: '-74.000703',
		nicknames: ['Jazz', ' Club']
	},
	{	id: 2,
		name: 'Gramercy Park',
		lat: '40.737918', 
		lng: '-73.985902',
		nicknames: ['Park']
	},
	{	id: 3,
		name: 'Chelsea Inn ',
		lat: '40.738736', 
		lng: '-73.994531',
		nicknames: ['Lodging', ' Hotel']
	},
	{	id: 4,
		name: 'AMC Loews',
		lat: '40.738560', 
		lng: '-73.989677',
		nicknames: ['Movie House ']
	}, 
	{	id: 5,
		name: 'NYU College of Dentistry',
		lat: '40.737912', 
		lng: '-73.978231',
		nicknames: ['NYU', ' University', ' Dentistry', ' School']
	}, 
	{	id: 6,
		name: 'Momofuku Milk Bar',
		lat: '40.731806', 
		lng: '-73.985851',
		nicknames: ['Bakery', ' Desserts']
	},	
	{	id: 7,
		name: 'Immaculate Conception Church',
		lat: '40.730749', 
		lng: '-73.982525',
		nicknames: ['Catholic', ' Church']
	},	
	{	id: 8,
		name: 'Bellevue Hospital Center',
		lat: '40.738437', 
		lng: '-73.975436',
		nicknames: ['Skin', ' Clinic ', ' Dermatology']
	},	
	{	id: 9,
		name: 'Village Vanguard',
		lat: '40.736027', 
		lng: '-74.001684',
		nicknames: ['Jazz', ' Club']
	},	
]	

var Loc = function(data) {
	this.id = ko.observable(data.id);
	this.name = ko.observable(data.name);
	this.lat = ko.observable(data.lat);
	this.lng = ko.observable(data.lng);
	this.nicknames = ko.observableArray(data.nicknames);
}

//View Model
var ViewModel = function() {
	var self = this;
	var myLatlng = new google.maps.LatLng(40.739174, -74.000236);
	var mapOptions = {
	    zoom: 15,
	    center: myLatlng
	  };
  
	  
    this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	this.markers = ko.observableArray([]);		// Observable Array for Markers
	this.searchLoc = ko.observable("");   		// Observable Search String
	
	// Computed observable function that displays ALL 
	// the Locations that matches the query string
	this.locList = ko.computed(function() {
		var matchedLoc = ko.observableArray();
		var searchStr = self.searchLoc().toLowerCase()

		// Loop thru the locations
		initialLocs.forEach(function(locItem) {
			// Search for Location match
			if ( locItem.name.toLowerCase().indexOf(searchStr) != -1) {
				matchedLoc.push(new Loc(locItem));
				}
			});
			return matchedLoc();
		}); // end locList()
	
	
	//API function to the Wikipedia Articles 
	this.getWikipedia = function (id,item){
    var articleStr = "";
    var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + item + '&format=json&callback=wikiCallback';

    var wikiRequestTimeout = setTimeout(function(){$wikiArticles[id] = "failed to get wikipedia resources";}, 8000);
        
	//Ajax call to retrieve the wiki articles
    $.ajax({
	    url: wikiURL,
	    dataType: "jsonp",
	    jsonp: "callback",
	    success: function( response ) {
		    var articleList = response[1];
		    var itemArticle = "";
		    
		    for (var i = 0; i < articleList.length; i++) {
			    articleStr = articleList[i];
			    var url = 'http://en.wikipedia.org/wiki/' + articleStr;
			    itemArticle = itemArticle.concat('<li><a href="' + url + '">' + articleStr + '</a></li>');
		    	};
		    	
		    $wikiArticles[id] = ((itemArticle.length == 0) ? 'No Wikipedia Article Found.' : itemArticle);
		    clearTimeout(wikiRequestTimeout);
			} // end success()
		}); // end ajax()
	} // end getWikipedia()
	
	//API function to the NY Times Articles
	this.getNYTimes = function (id, item){
	var searchTerm = item;
	var apiKey = "34215ca523656ef513eae99803edec73:18:71736301";
	var apiURL = "http://api.nytimes.com/svc/search/v2/articlesearch.json?q=" + searchTerm + "&api-key=" + apiKey;
	var itemArticle = "";

	$.getJSON(apiURL, function(data) {
		var docs = data.response.docs;
		for (var i=0; i < docs.length; i++){
			var doc = docs[i];
			itemArticle = itemArticle.concat('<li class="articles">' +
								'<a href="' + doc.web_url + '">' + doc.headline.main + '</a>' +
							    '</li>');
			}
			$nytmArticles[id] = ((itemArticle.length == 0) ? 'No NY Times Article Found.' : itemArticle);
		})// end getJSON()
	.error(function() {
		$nytmArticles[id] = 'Error on New York Times Articles About ' + searchTerm;
		});
	}// end getNYTimes()

	
	this.getLocDetails = function() {
		var idx;
		//Loop thru to get the Location details: wikipedia, NY Times, markers ...)
		for (var i = 0; i < self.locList().length; i++) {
		    var pos = new google.maps.LatLng(self.locList()[i].lat(), self.locList()[i].lng());
		 
		    //markers to each location
		    self.markers[i] = new google.maps.Marker({
		        position: pos,
		        map: this.map,
		        title: self.locList()[i].name(),
		        keywords: self.locList()[i].nicknames(),
		        id: self.locList()[i].id(),
		    });
			var locDetails = "";
		    var infowindow = new google.maps.InfoWindow({
		        //content: self.locList()[i].name(), //Moved to locDetails
		        maxWidth: 220
		    	});
		
		    //call to wiki API
		    self.getWikipedia(i, self.locList()[i].name());
		    //call to NYTimes API
		    self.getNYTimes(i, self.locList()[i].name());
		    
		    //Display the infowIndow with the wikipedia and NY Times aricles to each location
		    google.maps.event.addListener(self.markers[i], 'click', function () {
		        idx = this.id;
				locDetails = '<h2>' + self.markers[idx].title + '</h2>' + self.markers[idx].keywords +
			 					  '<h3 class="infoWindowH3">Wikipedia Articles</h3>' +
								  '<ul class="infoWindowUL">' + $wikiArticles[idx]+ '</ul>' + //Display Wiki articles
								  '<h3 class="infoWindowH3">New York Articles</h3>' +
								  '<ul class="infoWindowUL">' + $nytmArticles[idx] + '</ul>';	 //Display NY Times articles
		        infowindow.setContent(locDetails);
		        infowindow.open(this.map, self.markers[this.id]);
		        
		        //Animate the markers - Bounce
		        if (self.markers[idx].getAnimation() != null) {
		    		self.markers[idx].setAnimation(null);
		  		} else {
		    		self.markers[idx].setAnimation(google.maps.Animation.BOUNCE);
		  		}
		  		
		  		//Stop bouncing of the markers after 2 secs.
		  		window.setTimeout(function () { 
			  		self.markers[idx].setAnimation(null); 
			  		//infowindow.close();  //optional to close the infoWindow also
			  		}, 2000);
		    	});
			} //end for loop
		}; // end getLocDetails()
	
		
	//call to get Location Details
	self.getLocDetails();
	
	
	// Bounce the corresponding marker when the location is clicked
	this.showLoc = function(id) {
		var ix = id();
		// close the infowindow;
		if (this.infowindow) {
        	this.infowindow.close();
    		}

		//Center map
		this.map.setCenter(self.markers[id()].getPosition());
		
		//Animate the marker - Bounce
		self.markers[id()].setAnimation(google.maps.Animation.BOUNCE);
		
		//Stop bouncing of the marker after 2 secs.
	  	window.setTimeout(function () { 
			self.markers[id()].setAnimation(null); 
			}, 2000);
		}; // end showLoc() 
		
} // end ViewModel()

// Knockout Bindings
ko.applyBindings(new ViewModel());
// Here is the javascript setup for a basic map:

// Enter your mapbox map id here to reference it for the base layer,
// this one references the ugly green map that I made.
var mapId = 'jmitchell.019h3b8n';

// And this is my access token, use yours.
var accessToken = 'pk.eyJ1Ijoiam1pdGNoZWxsIiwiYSI6ImNpbnB2dGd0ZTEwMnl0dG0zMXYwdXJkeGQifQ.yCJcy3PY4kUgf3zu-AZeLw';

// Create the map object with your mapId and token,
// referencing the DOM element where you want the map to go.
L.mapbox.accessToken = accessToken;
var map = L.mapbox.map('map', mapId);

// Set the initial view of the map to the whole US
map.setView([39, -96], 4);

// Great, now we have a basic web map!

// reference to a locally sourced geojson file 
var dataFileToAdd = 'data/restaurants.geojson';

// use mapbox to create a new layer 
var featureLayer = L.mapbox.featureLayer();
// load in the geojson data 
featureLayer.loadURL(dataFileToAdd);
// add the new layer to the map from above 
featureLayer.addTo(map);

// add a listener to the layer to add points as icons 
featureLayer.on('ready', function() {
  this.eachLayer(function(layer) {
    layer.setIcon(L.mapbox.marker.icon({
      "marker-color": "#ff0000", 
      "marker-size": "large", 
      "marker-symbol": "restaurant"
    })); // setIcon 
  }); // eachLayer 
  
  map.fitBounds(featureLayer.getBounds());
}); // on 

// add another listener to ... 
featureLayer.on('ready', function() {
  this.eachLayer(function(layer) {
    //layer.bindPopup('Welcome to ' + layer.feature.properties.name);
    
    // layer.bindPopup(JSON.stringify(layer.feature.properties));
    // {"@id":"node/3656191609","name":"Jade Garden","phone":"+1-919-594-1813","website":null,"cuisine":"chinese"}
    
    var clickHandler = function(e) {
      $('#info').empty();
      
      var feature = e.target.feature;
      
      $('#sidebar').fadeIn(500, function() {
        var info = '';
        
        info += '<div>';
        info += '<h2>' + feature.properties.name + '</h2>';
        if (feature.properties.cuisine) info += '<p>' + feature.properties.cuisine + '</p>';
        if (feature.properties.phone) info += '<p>' + feature.properties.phone  + '</p>';
        if (feature.properties.website) info += '<p><a href="' + feature.properties.website + '">' + feature.properties.website + '</a></p>';
        info += '</div>';
        
        $('#info').append(info);

      }); // fadeIn 
      
      var myGeoJSON = myLocation.getGeoJSON();
      
      getDirections(myGeoJSON.geometry.coordinates, feature.geometry.coordinates);
            
    }; // clickHandler 
    
    // register a click event on each layer 
    layer.on('click', clickHandler);
    
  }); // eachLayer 
  
}); // on 

// hide the sidebar when the map itself is clicked 
map.on('click', function() {
  $('#sidebar').fadeOut(250);
}); // on 


// now add location to the map in a new feature layer 
var myLocation = L.mapbox.featureLayer()
		.addTo(map);

map.on('locationfound', function(e) {
  // use the position from the handler to build a geojson for the point 
  myLocation.setGeoJSON({
    type: "Feature", 
    geometry: {
      type: "Point", 
      coordinates: [ e.latlng.lng, e.latlng.lat ] 
    }, 
    properties: {
      "title": "Here I am!", 
      "marker-color": "#00ffff", 
      "marker-size": "medium", 
      "marker-symbol": "star" 
    }
  }); // setGeoJSON 
}); // on 

// use mapbox feature to grab position from browser 
map.locate({setView: true});

// placeholder layer for route path 
var routeLine = L.mapbox.featureLayer().addTo(map);

// add directions by leveraging mapzen turn-by-turn directions 
function getDirections(frm, to) {
  var jsonPayload = JSON.stringify({ 
    locations: [ 
      { "lat": frm[1], "lon": frm[0] }, 
      { "lat": to[1], "lon": to[0] }
    ], 
    costing: "pedestrian", 
    units: "miles"
  });
  
  $.ajax({ 
    url: 'https://valhalla.mapzen.com/route', 
    data: {
      json: jsonPayload, 
      api_key: 'valhalla-gwtf3x2' 
    } // data 
  })
  .done(function(data) {
    // the response is binary packed data 
    // there is a library file instructor made to decode the byte array into geojson 
    var routeShape = polyline.decode(data.trip.legs[0].shape);
    routeLine.setGeoJSON({
      type: "Feature", 
      geometry: {
        type: "Line", 
        coordinates: routeShape 
      }, 
      properties: {
        "stroke": "#ffff00", 
        "stroke-opacity": "0.5", 
        "stroke-width": 8 
      }
    }); // setGeoJSON 
  }) // done 
  ;
  
}; // getDirections 




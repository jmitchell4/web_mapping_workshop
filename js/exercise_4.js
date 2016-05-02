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
    }));
  });
  
  map.fitBounds(featureLayer.getBounds());
});

// add another listener to ... 
featureLayer.on('ready', function() {
  this.eachLayer(function(layer) {
    //layer.bindPopup('Welcome to ' + layer.feature.properties.name);
    
    // {"@id":"node/3656191609","name":"Jade Garden","phone":"+1-919-594-1813","website":null,"cuisine":"chinese"}
    // layer.bindPopup(JSON.stringify(layer.feature.properties));
    
    layer.bindPopup('Welcome to ' + layer.feature.properties.name
                   + "\n ID = " + layer.feature.properties.id
                   + "\n Phone: " + layer.feature.properties.phone
                   + "\n Cuisine: " + layer.feature.properties.cuisine
                   + "\n Website: " + layer.feature.properties.website);
  });
});


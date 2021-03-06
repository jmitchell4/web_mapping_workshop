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
var routeHighlight = L.mapbox.featureLayer().addTo(map);

// add directions by leveraging mapzen turn-by-turn directions 
function getDirections(frm, to) {
  var jsonPayload = JSON.stringify({ 
    locations: [ 
      { "lat": frm[1], "lon": frm[0] }, 
      { "lat": to[1], "lon": to[0] }
    ], 
    costing: "pedestrian", 
    directions_options: {
      units: "miles"
    }
  });
  
  $.ajax({ 
    url: 'https://valhalla.mapzen.com/route', 
    data: {
      json: jsonPayload, 
      api_key: 'valhalla-gwtf3x2' 
    } // data 
  })
  .done(function(data) {
    console.log(data);
    
    // the response is binary packed data 
    // there is a library file instructor made to decode the byte array into geojson 
    var routeShape = polyline.decode(data.trip.legs[0].shape);
    console.log(routeShape);
    
    var json = {
      type: "Feature", 
      geometry: {
        type: "LineString", 
        coordinates: routeShape 
      }, 
      properties: {
        "stroke": "#ffff00", 
        "stroke-opacity": 0.5, 
        "stroke-width": 8
      }
    };
    console.log(json);
    routeLine.setGeoJSON(json); // setGeoJSON 
    
    $('#directions').fadeIn(500, function() {
      $('#summary').empty();
      
      var summary = data.trip.summary;
      // since javascript only rounds to nearest integer, cheat and get 2 decimal places 
      $('#distance').text((Math.round(summary.length * 100) / 100) + ' ' + data.trip.units);
      $('#time').text((Math.round(summary.time / 60 * 100) / 100) + ' minutes');
    });
    
    data.trip.legs[0].maneuvers.forEach(function(item) {
      var direction = '';
      direction += '<li class="instruction" data-begin=' + item.begin_shape_index + ' data-end=' + item.end_shape_index + '>';
      if (item.verbal_post_transition_instruction) {
        direction += '<p class="post-transition">' + item.verbal_post_transition_instruction + '</p>';
      }
      if (item.verbal_pre_transition_instruction) {
        direction += '<p class="pre-transition">' + item.verbal_pre_transition_instruction + '</p>';
      }
      direction += '</li>';
      $('#summary').append(direction);
      
    }); // forEach 
    
    $('.instruction').on('mouseover', function() {
      var begin = Number($(this).attr('data-begin'));
      var end = Number($(this).attr('data-end'));
      
      var json = {
        type: "Feature", 
        geometry: {
          type: begin === end ? "Point" : "LineString", 
          coordinates: begin === end ? routeShape.slice(begin)[0] : routeShape.slice(begin, (end+1))
        }, 
        properties: {
          "stroke": "#ffffff", 
          "stroke-opacity": 0.5, 
          "stroke-width": 10
        }
      };
      routeHighlight.setGeoJSON(json);
      
      $('.instruction').on('mouseout', function() {
        routeHighlight.clearLayers();
      }); // mouseout 
      
    }); // mouseover 
    
  }) // done 
  ;
  
}; // getDirections 


map.on('click', function() {
  routeHighlight.clearLayers();
  routeLine.clearLayers();
});



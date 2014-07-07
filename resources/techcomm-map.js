var DATA_SERVICE_URL = "https://script.google.com/macros/s/AKfycbx75GBiRRl9qUyNMCH-BtDbOc4-g0WZSgCnqhvi6YvhCxYpJ1kJ/exec?jsonp=callback";
// DEFAULT_ZOOM is the default zoom level for the map.
// AUTO_ZOOM is the level used when we automatically zoom into a place when
// the user selects a marker or searches for a place.
// userZoom holds the zoom value the user has chosen.
var DEFAULT_ZOOM = 2;
var AUTO_ZOOM = 14;
var userZoom = DEFAULT_ZOOM;
var map;
var checkboxes = {};
var infoWindow = new google.maps.InfoWindow({
  pixelOffset: new google.maps.Size(0, -10),
  disableAutoPan: true
});
// The markerClicked flag indicates whether an info window is open because the
// user clicked a marker. True means the user clicked a marker. False
// means the user simply hovered over the marker, or the user has closed the
// info window.
var markerClicked = false;
var previousName;

// This function is called after the page has loaded, to set up the map.
function initializeMap() {
  map = new google.maps.Map(document.getElementById("map-canvas"), {
    center: {lat: 35.55, lng: 16.50},
    zoom: DEFAULT_ZOOM,
    panControl: false,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    }
  });
  setEventHandlers();
  // The techCommItemStyle() function computes how each item should be styled.
  // Register it here.
  map.data.setStyle(techCommItemStyle);

  // Insert a script element into the document header, to get
  // the tech comm data from a Google Docs spreadsheet via
  // a JSONP callback.
  var scriptElement = document.createElement('script');
  scriptElement.src = DATA_SERVICE_URL;
  document.getElementsByTagName('head')[0].appendChild(scriptElement);

  // Add the search box and data type selectors to the UI.
  var input = /** @type {HTMLInputElement} */(
    document.getElementById('place-search'));

  var types = document.getElementById('type-selector');
  var branding = document.getElementById('branding');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(branding);
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(types);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  var autocomplete = new google.maps.places.Autocomplete(input);

  // When the user searches for and selects a place, zoom in and add a marker.
  var searchMarker = new google.maps.Marker({
    map: map,
    visible: false,
  });

  autocomplete.addListener('place_changed', function() {
    searchMarker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }

    // If the place has a geometry, then show it on the map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(AUTO_ZOOM);
    }
    searchMarker.setIcon(/** @type {google.maps.Icon} */({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    searchMarker.setPosition(place.geometry.location);
    searchMarker.setVisible(true);
  });
}

// Get the data from the tech comm spreadsheet.
function callback(data) {
  // Get the spreadsheet rows one by one.
  // First row contains headings, so start the index at 1 not 0.
  for (var i = 1; i < data.length; i++) {
    map.data.add({
      properties: {
        type: data[i][0],
        name: data[i][1],
        description: data[i][2],
        website: data[i][3],
        startdate: data[i][4],
        enddate: data[i][5],
        address: data[i][6]
      },
      geometry: {
        lat: data[i][7], 
        lng: data[i][8]
      }
    });
  }
}

// Returns the style that should be used to display the given feature.
function techCommItemStyle(feature) {
  var type = feature.getProperty('type');

  var style = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillOpacity: 1,
      strokeWeight: 3,
      scale: 10        
    },
    // Show the markers for this type if
    // the user has selected the corresponding checkbox.
    visible: (checkboxes[type] != false)
  };

  // Set the marker colour based on type of tech comm item.
  switch (type) {
    case 'Conference':
      style.icon.fillColor = '#c077f1';
      style.icon.strokeColor = '#a347e1';
      break;
    case 'Society':
      style.icon.fillColor = '#f6bb2e';
      style.icon.strokeColor = '#ee7b0c';
      break;
    case 'Group':
      style.icon.fillColor = '#ee4bf3';
      style.icon.strokeColor = '#ff00ff';
      break;
    case 'Business':
      style.icon.fillColor = '#1ab61a';
      style.icon.strokeColor = '#008000';
      break;
    default:
      style.icon.fillColor = '#017cff';
      style.icon.strokeColor = '#0000ff';
  }
  return style;
}

function setEventHandlers() {
  // Show an info window when the user clicks an item.
  map.data.addListener('click', handleFeatureClick);

  // Show an info window when the mouse hovers over an item.
  map.data.addListener('mouseover', function(event) {
    createInfoWindow(event.feature);
    infoWindow.open(map);
  });

  // Close the info window when the mouse leaves an item.
  map.data.addListener('mouseout', function() {
    if (!markerClicked) {
      infoWindow.close();
    }
  });

  // Reset the click flag when the user closes the info window.
  infoWindow.addListener('closeclick', function() {
    markerClicked = false;
  });
}

// Create a popup window containing the tech comm info.
function createInfoWindow(feature) {
  infoWindow.setPosition(feature.getGeometry().get());
  infoWindow.setContent('No information found');
  var content = '<div id="infowindow" class="infowindow">';

  content += '<h2>' + feature.getProperty('name') + '</h2>';

  content += '<p><em>' + feature.getProperty('type') + '</em>';
  if (feature.getProperty('website')) {
    content += ' (' + feature.getProperty('website') + ')';
  }

  content += '<p>' + feature.getProperty('description');
  
  if (feature.getProperty('startdate')) {
    content += '<p>' + feature.getProperty('startdate');
    if (feature.getProperty('enddate')) {
      content += ' &ndash; ' + feature.getProperty('enddate');
    }
  }

  content += '<p>' + feature.getProperty('address');

  content += '</div>';
  infoWindow.setContent(content);
}

// On click of marker, show the popup window and zoom in.
function handleFeatureClick(event) {
  // Check whether the marker has been clicked already,
  // because we want to zoom out on second click of same marker.
  var currentName = event.feature.getProperty('name');
  if (currentName == previousName) {
    // This is the second click, so zoom back to user's previous zoom level.
    map.setZoom(userZoom);
    // Reset flags ready for next time round.
    previousName = '';
    markerClicked = false;
  } else {
    previousName = event.feature.getProperty('name'); 
    // This is the first click, so show the popup window and zoom in.
    createInfoWindow(event.feature);

    // Zoom in before opening the info window.
    // If the user has already zoomed in beyond our automatic zoom,
    // leave their zoom setting untouched.
    if (map.getZoom() > AUTO_ZOOM) {
      userZoom = map.getZoom();
    } else {
      map.setZoom(AUTO_ZOOM);
      map.setCenter(event.feature.getGeometry().get());
      userZoom = DEFAULT_ZOOM;
    }

    // Open the info window and reset flag ready for next time round.
    infoWindow.open(map);
    markerClicked = true;
  }
}

// Respond to change in conference type selectors.
function handleCheckBoxClick(checkBox, type) {
  checkboxes[type] = checkBox.checked;
  map.data.setStyle(techCommItemStyle);
}

// Load the map.
google.maps.event.addDomListener(window, 'load', initializeMap);

// Initialize the map without setting the initial view (it will be set based on GeoJSON bounds).
const map = L.map('map');

// Add a CartoDB Positron tile layer for a minimalistic map style
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://carto.com/">CartoDB</a> contributors'
}).addTo(map);

// Add a search control using Leaflet Control Geocoder
const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false
})
.on('markgeocode', function(e) {
    const bbox = e.geocode.bbox;
    const poly = L.polygon([
        [bbox.getSouthEast().lat, bbox.getSouthEast().lng],
        [bbox.getNorthEast().lat, bbox.getNorthEast().lng],
        [bbox.getNorthWest().lat, bbox.getNorthWest().lng],
        [bbox.getSouthWest().lat, bbox.getSouthWest().lng]
    ]).addTo(map);
    map.fitBounds(poly.getBounds());
})
.addTo(map);

// Function to get color based on the index value
function getColor(index) {
    return index > 0.8 ? '#4CAF50' :
           index > 0.6 ? '#8BC34A' :
           index > 0.4 ? '#CDDC39' :
           index > 0.2 ? '#FFEB3B' :
                         '#FF5722';
}

// Function to style each feature based on the main index value
function style(feature) {
    return {
        fillColor: getColor(feature.properties['00_BDII_BD']),
        weight: 1,
        opacity: 1,
        color: '#999',
        fillOpacity: 0.7
    };
}

// Create an info control for displaying data when hovering over regions
const info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

// Update the control based on feature properties
info.update = function (props) {
    this._div.innerHTML = '<h4>Digital Inclusion Index</h4>' +  (props ? 
        '<b>' + props.OA21CD + '</b><br />' + 
        'Overall Digital Inclusion Index: ' + (props['00_BDII_BD'] * 100).toFixed(2) + '%<br>' +
        'Accessibility Index: ' + (props['Accessibility Index'] * 100).toFixed(2) + '%<br>' +
        'Affordability Index: ' + (props['Affordability Index'] * 100).toFixed(2) + '%<br>' +
        'Ability Index: ' + (props['Ability Index'] * 100).toFixed(2) + '%<br>' +
        'Behaviour Index: ' + (props['Behaviour Index'] * 100).toFixed(2) + '%<br>' : 
        'Hover over a region');
};

info.addTo(map);

// Variable to store the currently selected feature
let selectedFeature = null;

// Function to highlight feature on hover
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

// Function to reset highlight, but not for the selected feature
function resetHighlight(e) {
    if (selectedFeature !== e.target) {
        geojson.resetStyle(e.target);
    }
    info.update();
}

// Function to zoom to feature when clicked and keep it selected
function zoomToFeature(e) {
    if (selectedFeature) {
        geojson.resetStyle(selectedFeature); // Reset style for previously selected feature
    }
    
    map.fitBounds(e.target.getBounds());
    highlightSelected(e.target); // Highlight the newly selected feature
    showDetails(e.target.feature); // Show details in the sidebar
}

// Function to highlight the selected feature with a thicker border
function highlightSelected(layer) {
    layer.setStyle({
        weight: 5,        // Thicker border
        color: '#000',    // Darker color
        dashArray: '',    // Remove any dash
        fillOpacity: 0.7  // Keep fill opacity the same
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    selectedFeature = layer; // Store the currently selected feature
}

// Attach event listeners to each feature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Load GeoJSON data for Digital Inclusion Index and set initial view
let geojson;
fetch('BDI_index.geojson') // Ensure this file is in the same directory as your project files
    .then(response => response.json())
    .then(data => {
        geojson = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
        
        // Fit map to the bounds of the GeoJSON data
        map.fitBounds(geojson.getBounds());
    })
    .catch(error => console.error('Error loading GeoJSON data:', error));

// Load GeoJSON data for Network Points
let networkLayer;
fetch('DI_network.geojson') // Ensure this file is in the same directory as your project files
    .then(response => response.json())
    .then(data => {
        networkLayer = L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: '#0073e6',
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function(feature, layer) {
                // Remove Latitude and Longitude from the popup
                let description = feature.properties.description || '';
                description = description.replace(/Latitude: .+?\n/, ''); // Remove Latitude
                description = description.replace(/Longitude: .+?\n/, ''); // Remove Longitude
                
                layer.bindPopup(`<b>${feature.properties.Name}</b><br>${description}`);
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON network data:', error));

// Show detailed information about the clicked region
function showDetails(feature) {
    const infoBox = document.querySelector('.info-box');
    let details = `
        <h4>Bradford Digital Inclusion Index</h4>
        <p><b>OA21CD:</b> ${feature.properties.OA21CD}</p>
        <p><b>Overall Digital Inclusion Index:</b> ${(feature.properties['00_BDII_BD'] * 100).toFixed(2)}%</p>
        <p><b>Accessibility Index:</b> ${(feature.properties['Accessibility Index'] * 100).toFixed(2)}%</p>
        <p><b>Affordability Index:</b> ${(feature.properties['Affordability Index'] * 100).toFixed(2)}%</p>
        <p><b>Ability Index:</b> ${(feature.properties['Ability Index'] * 100).toFixed(2)}%</p>
        <p><b>Behaviour Index:</b> ${(feature.properties['Behaviour Index'] * 100).toFixed(2)}%</p>
        <h5>Good Things Foundation Points:</h5>
        <ul>`;

    // Check for network points within the selected region
    networkLayer.eachLayer(function(layer) {
        const point = layer.getLatLng();
        if (turf.booleanPointInPolygon([point.lng, point.lat], feature.geometry)) {
            let description = layer.feature.properties.description || '';
            description = description.replace(/Latitude: .+?\n/, ''); // Remove Latitude
            description = description.replace(/Longitude: .+?\n/, ''); // Remove Longitude

            details += `<li><b>${layer.feature.properties.Name}:</b> ${description}</li>`; // Ensure 'Name' is the correct field
        }
    });

    details += '</ul>';
    infoBox.innerHTML = details;
}

// Create a legend control for the map
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 0.2, 0.4, 0.6, 0.8],
        labels = [];

    // Loop through index intervals and generate a label with a colored square for each interval
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 0.01) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    div.innerHTML += '<i style="background:#4CAF50"></i> More Digitally Included<br>';
    div.innerHTML += '<i style="background:#FF5722"></i> More Digitally Deprived';

    return div;
};

legend.addTo(map);

var map = null;
function initMap() {
    
    if (map != null) delete map;

    map = new google.maps.Map(
        document.getElementById("gmap"),
        {
            zoom: 5,
            center: { lat: -28.643387, lng: 153.612224 }, //
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER,
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER,
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP,
            },
            fullscreenControl: true,
        }
    );
}

var marker = null;
function changeMapPos(lat, lng) {
    if (marker) delete marker;
    var myLatLng = {lat:parseFloat(lat), lng:parseFloat(lng)};
    marker = new google.maps.Marker({
        position: myLatLng,
        map,
        title: "Hello World!",
    });
    console.log(`lat=${lat} lng=${lng}`)
    map.setCenter(new google.maps.LatLng( parseFloat(lat), parseFloat(lng) ) );
}

window.initMap = initMap;

async function view_map(result) {
    if (tab_hist.hasOwnProperty("map")) return;
    
    if (global_info.rdf) {
        if (global_info.geo == undefined) {
            var geo = await getGeoLocation(global_info.rdf.uri);
            if (geo.lat && geo.lng) {
                global_info.geo = geo;
            } else {
                global_info.geo = {};
            }
        }
        
        if (global_info.geo.lat) {
            var geo = global_info.geo;
            document.getElementById('map_result').innerHTML = "";
            changeMapPos(geo.lat, geo.lng);
            document.getElementById('map').style.display = "block";
            return;
        }
    }
    var postCode = getAddress(result);
    if (postCode != null && postCode != '') {
        var entityName = getEntityName(result);
        getMap(postCode, entityName);
    } else {
        document.getElementById('map_result').innerHTML = 'No map information. Please check ABN or ACN information before map.';
    }
}


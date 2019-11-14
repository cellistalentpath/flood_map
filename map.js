// Initialize and add the map
var map;

function initMap() {
  var geoC = new google.maps.Geocoder();
  function codeAddress(addressIn) {
    var address = addressIn;
    geoC.geocode(
      {
        address: address
      },
      function(results, status) {
        if (status == "OK") {
          map = new google.maps.Map(document.getElementById("map"), {
            zoom: 11,
            center: results[0].geometry.location,
            styles: styles
          });

          // some debug output
          //console.log("status is: " + status);
          // console.log(
          //   "results is: " + JSON.stringify(results[0].geometry.location)
          // );
        } else {
          console.log("This didnt work" + status);
        }
      }
    );
  }
  // Ask company at start of use where their location is
  codeAddress("1400 S Post Oak, Houston, TX");

  // CHECK FOR EXISTING ADDRESSES
  // DON'T WANT TO CREATE "NEW MARKERS" EVERYTIME
  // STORE IN ARRAY?
  // Let google map load, find some sort of onload method
  setTimeout(() => {
    retrieveAddresses();
  }, 500);
  // Pull addresses every minute, same as onedrive update rate
  setInterval(() => {
    retrieveAddresses();
  }, 60000);
}

async function retrieveAddresses() {
  const url = "http://localhost:3100/map/addresses";
  let addresses = [];
  try {
    const response = await fetch(url, {
      method: "POST", // or 'PUT'
      body: JSON.stringify({ Message: "Hello" }), //Selected location goes here
      headers: {
        "Content-Type": "application/json"
      }
    });
    //console.log(response);
    addresses = await response.text();
    //console.log("retrieve: " + JSON.parse(addresses));
    addresses = JSON.parse(addresses);
    //console.log("testyyyyy: " + addresses.length);
    for (i = 0; i < addresses.length; i++) {
      addMarker(addresses[i]);
    }
    //console.log("Success:", JSON.stringify(json));
  } catch (error) {
    console.error("Error:", error);
  }
  //console.log(addresses);
  return addresses;
}

async function formatAddress(url) {
  try {
    //let formatted = "";
    // await fetch(url).then(response => {
    //   return response.json();
    // });
    const response = await fetch(url);

    const help = await response.json();
    console.log(help.results);
    return help;
    //console.log("HEEEEELP: " + formattedAddress);
    //return formatted;
    //console.log("data is: " + JSON.parse(formattedAddress));
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

function addMarker(address) {
  var geoC = new google.maps.Geocoder();
  //var address = document.getElementById("addressText").value;
  //console.log(address);
  geoC.geocode(
    {
      address: address
    },
    function(results, status) {
      if (status == "OK") {
        var image = {
          url: "./bad.png",
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          icon: image,
          animation: google.maps.Animation.DROP
        });

        const reverseGeo =
          "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
          results[0].geometry.location.lat() +
          "," +
          results[0].geometry.location.lng() +
          "&key=AIzaSyDrhUvrwMun8LUY2L-g80qk3YNfu3BUcdY";
        //console.log(reverseGeo);

        const formatted = formatAddress(reverseGeo);
        console.log(JSON.stringify(formatted));

        const infowindow = new google.maps.InfoWindow({
          content: "test"
        });
        // Gives error because fetch isn't working rn
        marker.addListener("click", function() {
          infowindow.open(map, marker);
        });

        // some debug output
        //console.log("status is: " + status);
        //console.log(
        //"results is: " + JSON.stringify(results[0].geometry.location)
        //);
      } else {
        //console.log("This didnt work: " + status);
      }
    }
  );
}

styles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

//Swal.fire("Good job!", "You clicked the button!", "success");

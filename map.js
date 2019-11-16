// Initialize and add the map
let map;
const url = "http://localhost:3200";
let heldAddresses = {};

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
        } else {
          console.log("This didnt work" + status);
        }
      }
    );
  }
  // Ask company at start of use where their location is
  codeAddress("1400 S Post Oak, Houston, TX");
  // Let google map load
  new google.maps.event.addDomListener(window, "load", getData);

  // CHECK FOR EXISTING ADDRESSES
  // DON'T WANT TO CREATE "NEW MARKERS" EVERYTIME
  // STORE IN ARRAY?

  // Pull addresses every minute, same as onedrive update rate
  // setInterval(() => {
  //   getData();
  // }, 30000);
}

async function getEverything() {
  let addresses;
  try {
    const response = await fetch(url + "/map/everything");
    addresses = await response.text();
    addresses = JSON.parse(addresses);
    return addresses;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

getData = () => {
  getEverything().then(addresses => {
    addMarker(addresses);
  });
};

addMarker = addressArray => {
  let geoC = new google.maps.Geocoder();
  for (const address in addressArray) {
    geoC.geocode(
      {
        address: address
      },
      function(results, status) {
        const addressHeld = addressArray[address];
        const formattedHeld = results[0].formatted_address;
        let inside = addressArray[address].insideDMGValue;
        let parking = addressArray[address].parkingDMGValue;
        if (heldAddresses[formattedHeld] === undefined) {
          heldAddresses[formattedHeld] = {
            addressHeld,
            inside,
            parking
          };
        } else {
          inside = inside + heldAddresses[formattedHeld].inside;
          parking = parking + heldAddresses[formattedHeld].parking;
          heldAddresses[formattedHeld] = { addressHeld, inside, parking };
        }

        //console.log(heldAddresses);
        // for (i = 0; i < heldAddresses.length; i++) {

        // }
        if (status == "OK") {
          var image = {
            url: "./good.png",
            scaledSize: new google.maps.Size(25, 25)
          };
          if (
            heldAddresses[formattedHeld].inside +
              heldAddresses[formattedHeld].parking >
            0
          ) {
            image = {
              url: "./bad.png",
              scaledSize: new google.maps.Size(25, 25)
            };
          } else if (
            heldAddresses[formattedHeld].inside +
              heldAddresses[formattedHeld].parking ===
            0
          ) {
            image = {
              url: "./okay.png",
              scaledSize: new google.maps.Size(25, 25)
            };
          }

          var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location,
            icon: image,
            animation: google.maps.Animation.NONE
          });
          const infowindow = new google.maps.InfoWindow({
            content: results[0].formatted_address
          });

          marker.addListener("click", function() {
            infowindow.open(map, marker);
          });
        } else {
          console.log("This didnt work: " + status);
          return null;
        }
      }
    );
  }
};

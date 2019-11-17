// Initialize and add the map
let map;
const url = "https://99.26.184.205:4243";
let heldAddresses = {};
let markerArray = [];
let markerLatLngArray = [];

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

  // Pull addresses every 15 seconds, onedrive updates every minute
  setInterval(() => {
    getData();
  }, 15000);
}

getData = () => {
  getEverything().then(addresses => {
    addMarker(addresses);
  });
};

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

addMarker = addressArray => {
  let geoC = new google.maps.Geocoder();
  for (const address in addressArray) {
    geoC.geocode(
      {
        address: address
      },
      function(results, status) {
        const id = addressArray[address].idValue;
        const formattedHeld = results[0].formatted_address;
        const inside = addressArray[address].insideDMGValue;
        const parking = addressArray[address].parkingDMGValue;

        if (heldAddresses[id] === undefined) {
          heldAddresses[id] = {
            formattedHeld,
            inside,
            parking
          };
        }

        let totalInside = 0;
        let totalParking = 0;
        let totalFlood = 0;

        for (const id in heldAddresses) {
          if (
            heldAddresses[id].formattedHeld === results[0].formatted_address
          ) {
            totalInside += heldAddresses[id].inside;
            totalParking += heldAddresses[id].parking;
          }
        }
        totalFlood = totalInside + totalParking;

        if (status == "OK") {
          let image;

          if (totalFlood < 0) {
            image = {
              url: "./good.png",
              scaledSize: new google.maps.Size(25, 25)
            };
          } else if (totalFlood > 0) {
            image = {
              url: "./bad.png",
              scaledSize: new google.maps.Size(25, 25)
            };
          } else if (totalFlood === 0) {
            image = {
              url: "./okay.png",
              scaledSize: new google.maps.Size(25, 25)
            };
          }

          if (
            isLocationFree([
              results[0].geometry.location.lat(),
              results[0].geometry.location.lng()
            ])
          ) {
            var marker = new google.maps.Marker({
              map: map,
              position: results[0].geometry.location,
              icon: image,
              animation: google.maps.Animation.NONE
            });
            markerArray.push(marker);
            markerLatLngArray.push([
              results[0].geometry.location.lat(),
              results[0].geometry.location.lng()
            ]);

            const infowindow = new google.maps.InfoWindow({
              content: results[0].formatted_address
            });

            marker.addListener("click", function() {
              infowindow.open(map, marker);
            });
          } else {
            for (i = 0; i < markerArray.length; i++) {
              if (
                markerArray[i].position.lat() ===
                  results[0].geometry.location.lat() &&
                markerArray[i].position.lng() ===
                  results[0].geometry.location.lng() &&
                image.url !== markerArray[i].getIcon().url
              ) {
                console.log(
                  "marker's current icon: " + markerArray[0].getIcon().url
                );
                console.log("marker's new icon: " + image.url);
                console.log(
                  results[0].formatted_address + " is changing icon!"
                );
                markerArray[i].setIcon(image);
              }
            }
          }
        } else {
          console.log("This didnt work: " + status);
          return null;
        }
      }
    );
  }
};

isLocationFree = LatLng => {
  for (i = 0; i < markerLatLngArray.length; i++) {
    if (
      markerLatLngArray[i][0] === LatLng[0] &&
      markerLatLngArray[i][1] === LatLng[1]
    ) {
      return false;
    }
  }
  return true;
};

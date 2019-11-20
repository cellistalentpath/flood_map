// Initialize and add the map
let map;
const url = "http://99.26.184.205:4243"; //"http://localhost:4243"
let heldAddresses = {};
let markerArray = [];
let markerLatLngArray = [];
let go = true;
let counter = 10;

function initMap() {
  var geoC = new google.maps.Geocoder();
  function codeAddress(addressIn) {
    var address = addressIn;
    geoC.geocode(
      {
        address: address
      },
      function(results, status) {
        if (status === "OK") {
          map = new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
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

  // Pull addresses every 10 seconds, onedrive updates every minute

  setInterval(() => {
    go = true;
  }, 50);

  setInterval(() => {
    getData();
  }, 1000);
}

getData = () => {
  getEverything().then(addresses => {
    for (id in addresses) {
      if (heldAddresses[id] === undefined && go) {
        addMarker(id, addresses);
        go = false;
      }
    }
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

addMarker = (id, addressArray) => {
  let geoC = new google.maps.Geocoder();
  geoC.geocode(
    {
      address: addressArray[id].addressValue
    },
    function(results, status) {
      console.log(results[0].formatted_address);
      const formattedHeld = results[0].formatted_address;
      const inside = addressArray[id].insideDMGValue;
      const parking = addressArray[id].parkingDMGValue;
      heldAddresses[id] = {
        formattedHeld,
        inside,
        parking
      };

      let totalInside = 0;
      let totalParking = 0;
      let totalFlood = 0;

      for (const id in heldAddresses) {
        if (heldAddresses[id].formattedHeld === results[0].formatted_address) {
          totalInside += heldAddresses[id].inside;
          totalParking += heldAddresses[id].parking;
        }
      }
      totalFlood = totalInside + totalParking;

      if (status === "OK") {
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
          let encoded = results[0].formatted_address.replace(/ /g, "+");
          encoded = encoded.replace(/,/g, "");
          let search = "https://google.com/search?q=" + encoded;
          let testthis =
            "<div>" +
            `<a href=${search} > ${results[0].formatted_address} </a>` +
            "<div>";
          const infowindow = new google.maps.InfoWindow({
            content: testthis //results[0].formatted_address
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

// Initialize and add the map
let map;
const url = "http://localhost:4243"; //"http://localhost:4243"; //"http://99.26.184.205:4243";
let heldAddresses = {};
let markerArray = [];
let markerLatLngArray = [];
let go = true;
let counter = 0;
let addressesLength = 1;
let nextAddress = 0;

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
            zoom: 12,
            center: results[0].geometry.location,
            styles: styles
          });
          let comp_logo = {
            url: "./tp-logo.png",
            scaledSize: new google.maps.Size(40, 40)
          };
          let marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location,
            icon: comp_logo,
            animation: google.maps.Animation.NONE
          });
        } else {
          console.log("This didnt work" + status);
        }
      }
    );
  }
  // Ask company at start of use where their location is
  codeAddress("1400 Post Oak Blvd Suite 200, Houston, TX 77056");

  // Let google map load
  new google.maps.event.addDomListener(window, "load", doIT);

  // Pull addresses once, must refresh to get new addresses

  setInterval(() => {
    go = true;
  }, 50);
}

doIT = () => {
  getFormatted().then(data => {
    for (address in data) {
      addExisting(data[address]);
      heldAddresses[data[address].id] = data[address];
    }
  });
  setInterval(() => {
    if (counter < addressesLength) {
      getFormatted().then(data => {
        getEverything().then(addresses => {
          addressesLength = Object.keys(addresses).length;
          if (addressesLength != Object.keys(data).length) {
            for (id in addresses) {
              if (heldAddresses[id] === undefined && go) {
                addMarker(id, addresses);
                go = false;
                counter++;
              }
            }
          }
        });
      });
    }
  }, 1000);
};

// getData = () => {
//   getEverything().then(addresses => {
//     addressesLength = Object.keys(addresses).length;
//     for (id in addresses) {
//       if (heldAddresses[id] === undefined && go) {
//         addMarker(id, addresses);
//         go = false;
//       }
//     }
//   });
// };

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

async function getFormatted() {
  let addresses;
  try {
    const response = await fetch(url + "/map/formatted");
    addresses = await response.text();
    //console.log(addresses);
    addresses = JSON.parse(addresses);
    return addresses;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function putFormatted(newObj) {
  try {
    await fetch(url + "/map/formatted", {
      method: "POST",
      body: newObj
    });
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

function addExisting(address) {
  let image;
  let totalFlood = address.totalFlood;
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
  var marker = new google.maps.Marker({
    map: map,
    position: address.latlng,
    icon: image,
    animation: google.maps.Animation.NONE
  });
  markerArray.push(marker);
  markerLatLngArray.push([address.latlng.lat, address.latlng.lng]);

  let encoded = address.formattedHeld.replace(/ /g, "+");
  encoded = encoded.replace(/,/g, "");
  let search = "https://google.com/search?q=" + encoded;
  let address_goog_link =
    "<div>" +
    `<a href=${search} target = "_blank"> ${address.formattedHeld} </a>` +
    "<div>";

  const infowindow = new google.maps.InfoWindow({
    content: address_goog_link
  });

  marker.addListener("click", function() {
    infowindow.open(map, marker);
  });
}

addMarker = (id, addressArray) => {
  let geoC = new google.maps.Geocoder();
  geoC.geocode(
    {
      address: addressArray[id].addressValue
    },
    function(results, status) {
      const formattedHeld = results[0].formatted_address;
      const inside = addressArray[id].insideDMGValue;
      const parking = addressArray[id].parkingDMGValue;
      const latlng = results[0].geometry.location;

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

      putFormatted(JSON.stringify({ id, formattedHeld, totalFlood, latlng }));

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
          isLocationFree(
            [
              results[0].geometry.location.lat(),
              results[0].geometry.location.lng()
            ],
            markerLatLngArray
          )
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
          let address_goog_link =
            "<div>" +
            `<a href=${search} target = "_blank"> ${results[0].formatted_address} </a>` +
            "<div>";

          const infowindow = new google.maps.InfoWindow({
            content: address_goog_link
          });

          marker.addListener("click", function() {
            infowindow.open(map, marker);
          });
        } else {
          // Location already has marker, check if icon should be updated
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

isLocationFree = (LatLng, array_of_lat_lng) => {
  for (i = 0; i < array_of_lat_lng.length; i++) {
    if (
      array_of_lat_lng[i][0] === LatLng[0] &&
      array_of_lat_lng[i][1] === LatLng[1]
    ) {
      return false;
    }
  }
  return true;
};

//module.exports = { isLocationFree, getEverything, addMarker };

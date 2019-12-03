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
    //console.log(data);
    for (address in data) {
      addExisting(data[address], data);
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
  }, 1200);
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

function addExisting(address, addressObject) {
  let image = {
    url: "./bad.png",
    scaledSize: new google.maps.Size(25, 25)
  };
  let totalFlood = address.totalFlood;
  if (totalFlood < 0) {
    image = {
      url: "./good.png",
      scaledSize: new google.maps.Size(25, 25)
    };
  } else if (totalFlood === 0) {
    image = {
      url: "./okay.png",
      scaledSize: new google.maps.Size(25, 25)
    };
  }
  if (
    isLocationFree([address.latlng.lat, address.latlng.lng], markerLatLngArray)
  ) {
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

    let insidePercentage;
    let parkingPercentage;
    let insideHTML;
    let parkingHTML;
    let trueInside = 0;
    let trueParking = 0;
    for (id in addressObject) {
      if (addressObject[id].formattedHeld === address.formattedHeld) {
        trueInside += addressObject[id].totalInside;
        trueParking += addressObject[id].totalParking;
        // console.log(
        //   address.formattedHeld + ": " + addressObject[id].totalInside
        // );
      }
    }
    //console.log(address.formattedHeld + ": " + trueInside);
    if (trueInside > 0) {
      //console.log(address.totalInside / address.totalResidents);
      //console.log(address.formattedHeld + ": " + address.totalInside);
      insidePercentage = trueInside / address.totalResidents;
      insidePercentage = ((1 - insidePercentage) * 100).toFixed(0);
      if (insidePercentage == 0) {
        insidePercentage = 100;
      }
      insideHTML = `<div><b>${insidePercentage}%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    } else if (trueInside < 0) {
      insidePercentage = trueInside / address.totalResidents;
      insidePercentage = (insidePercentage * -100).toFixed(0);
      if (insidePercentage == 100) {
        insidePercentage = 0;
      }
      insideHTML = `<div><b>${insidePercentage}%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    } else {
      insideHTML = `<div> <b>50%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    }

    if (trueParking > 0) {
      //console.log(address.totalInside / address.totalResidents);
      //console.log(address.formattedHeld + ": " + address.totalInside);
      parkingPercentage = trueParking / address.totalResidents;
      parkingPercentage = ((1 - parkingPercentage) * 100).toFixed(0);
      if (parkingPercentage == 0) {
        parkingPercentage = 100;
      }
      parkingHTML = `<div><b>${parkingPercentage}%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    } else if (trueParking < 0) {
      parkingPercentage = trueParking / address.totalResidents;
      parkingPercentage = (parkingPercentage * -100).toFixed(0);
      if (parkingPercentage == 100) {
        parkingPercentage = 0;
      }
      parkingHTML = `<div><b>${parkingPercentage}%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    } else {
      parkingHTML = `<div> <b>50%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    }

    const infowindow = new google.maps.InfoWindow({
      content: address_goog_link + insideHTML + parkingHTML
    });

    marker.addListener("click", function() {
      infowindow.open(map, marker);
    });
  } else {
    // Location already has marker, check if icon should be updated
    for (i = 0; i < markerArray.length; i++) {
      if (
        markerArray[i].position.lat() === address.latlng.lat &&
        markerArray[i].position.lng() === address.latlng.lng &&
        image.url !== markerArray[i].getIcon().url
      ) {
        markerArray[i].setIcon(image);
      }
    }
  }
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
      let totalResidents = 1;

      let totalInside = inside;
      let totalParking = parking;
      let totalFlood = 0;

      //console.log(totalInside);

      for (const myID in heldAddresses) {
        if (
          heldAddresses[myID].formattedHeld === results[0].formatted_address
        ) {
          //totalInside += heldAddresses[myID].totalInside;
          //console.log(totalInside);
          //totalParking += heldAddresses[myID].totalParking;
          totalResidents += 1;
        }
      }

      heldAddresses[id] = {
        formattedHeld,
        totalInside,
        totalParking,
        totalResidents
      };

      totalFlood = totalInside + totalParking;
      //console.log(heldAddresses[id]);

      putFormatted(
        JSON.stringify({
          id,
          formattedHeld,
          totalInside,
          totalParking,
          totalFlood,
          latlng,
          totalResidents
        })
      );

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

        // if (
        //   isLocationFree(
        //     [
        //       results[0].geometry.location.lat(),
        //       results[0].geometry.location.lng()
        //     ],
        //     markerLatLngArray
        //   )
        // ) {
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

        let insidePercentage;
        let parkingPercentage;
        let insideHTML;
        let parkingHTML;
        let trueInside = 0;
        let trueParking = 0;
        for (id in heldAddresses) {
          if (
            heldAddresses[id].formattedHeld === results[0].formatted_address
          ) {
            trueInside += heldAddresses[id].totalInside;
            trueParking += heldAddresses[id].totalParking;
            // console.log(
            //   address.formattedHeld + ": " + addressObject[id].totalInside
            // );
          }
        }
        //console.log(address.formattedHeld + ": " + trueInside);
        if (trueInside > 0) {
          //console.log(address.totalInside / address.totalResidents);
          //console.log(address.formattedHeld + ": " + address.totalInside);
          insidePercentage = trueInside / totalResidents;
          insidePercentage = ((1 - insidePercentage) * 100).toFixed(0);
          if (insidePercentage == 0) {
            insidePercentage = 100;
          }
          insideHTML = `<div><b>${insidePercentage}%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        } else if (trueInside < 0) {
          insidePercentage = trueInside / totalResidents;
          insidePercentage = (insidePercentage * -100).toFixed(0);
          if (insidePercentage == 100) {
            insidePercentage = 0;
          }
          insideHTML = `<div><b>${insidePercentage}%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        } else {
          insideHTML = `<div> <b>50%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        }

        if (trueParking > 0) {
          //console.log(address.totalInside / address.totalResidents);
          //console.log(address.formattedHeld + ": " + address.totalInside);
          parkingPercentage = trueParking / totalResidents;
          parkingPercentage = ((1 - parkingPercentage) * 100).toFixed(0);
          if (parkingPercentage == 0) {
            parkingPercentage = 100;
          }
          parkingHTML = `<div><b>${parkingPercentage}%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
        } else if (trueParking < 0) {
          parkingPercentage = trueParking / totalResidents;
          parkingPercentage = (parkingPercentage * -100).toFixed(0);
          if (parkingPercentage == 100) {
            parkingPercentage = 0;
          }
          parkingHTML = `<div><b>${parkingPercentage}%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
        } else {
          parkingHTML = `<div> <b>50%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
        }
        //console.log(address_goog_link + insidePercentage + parkingPercentage);
        const infowindow = new google.maps.InfoWindow({
          content: address_goog_link + insideHTML + parkingHTML
        });

        marker.addListener("click", function() {
          infowindow.open(map, marker);
        });
        // } else {
        //   // Location already has marker, check if icon should be updated
        //   for (i = 0; i < markerArray.length; i++) {
        //     if (
        //       markerArray[i].position.lat() ===
        //         results[0].geometry.location.lat() &&
        //       markerArray[i].position.lng() ===
        //         results[0].geometry.location.lng() &&
        //       image.url !== markerArray[i].getIcon().url
        //     ) {
        //       markerArray[i].setIcon(image);
        //     }
        //   }
        // }
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

// Initialize and add the map
let map;
var geoC;
const url = "http://localhost:4243"; //https://flood-map42.herokuapp.com
let heldAddresses = {};
let markerArray = [];
let infoWindowArray = [];
let markerLatLngArray = [];
let go = true;
let counter = 0;
let addressesLength = 1;

let isGoodOn = true;
let isOkayOn = true;
let isBadOn = true;

function initMap() {
  geoC = new google.maps.Geocoder();
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
          // let comp_logo = {
          //   url: "./tp-logo.png",
          //   scaledSize: new google.maps.Size(40, 40)
          // };
          // let marker = new google.maps.Marker({
          //   map: map,
          //   position: results[0].geometry.location,
          //   icon: comp_logo,
          //   animation: google.maps.Animation.NONE
          // });
        } else {
          console.log("This didnt work" + status);
        }
      }
    );
  }
  // Companies main office goes here
  codeAddress("Houston, TX");

  // Let google map load
  new google.maps.event.addDomListener(window, "load", doIT);

  // Used to stagger geocoding requests
  setInterval(() => {
    go = true;
  }, 100);
}

doIT = () => {
  getFormatted().then(data => {
    for (address in data) {
      addExistingMarker(data[address], data);
      heldAddresses[data[address].id] = data[address];
    }
  });
  setInterval(() => {
    getFormatted().then(data => {
      getEverything().then(addresses => {
        addressesLength = Object.keys(addresses).length;
        if (addressesLength != Object.keys(data).length) {
          for (id in addresses) {
            if (heldAddresses[id] === undefined && go) {
              addNewMarker(id, addresses);
              go = false;
            }
          }
        }
      });
    });
  }, 2000);
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

async function getFormatted() {
  let addresses;
  try {
    const response = await fetch(url + "/map/formatted");
    addresses = await response.text();
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

function getMarkerIcon(totalFlood) {
  let image = {
    url: "./bad.png",
    scaledSize: new google.maps.Size(25, 25)
  };
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
  return image;
}

function addExistingMarker(address, addressObject) {
  let totalFlood = 0;
  let insidePercentage;
  let parkingPercentage;
  let insideHTML;
  let parkingHTML;
  let trueInside = 0;
  let trueParking = 0;
  let insideDMG = 0;
  let parkingDMG = 0;
  for (id in addressObject) {
    if (addressObject[id].formattedHeld === address.formattedHeld) {
      trueInside += addressObject[id].totalInside;
      trueParking += addressObject[id].totalParking;
      if (addressObject[id].totalInside === 1) {
        insideDMG++;
      }
      if (addressObject[id].totalParking === 1) {
        parkingDMG++;
      }
    }
  }
  totalFlood = trueInside + trueParking;

  if (
    isLocationFree([address.latlng.lat, address.latlng.lng], markerLatLngArray)
  ) {
    var marker = new google.maps.Marker({
      map: map,
      position: address.latlng,
      icon: getMarkerIcon(totalFlood),
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

    if (trueInside > 0) {
      insidePercentage = insideDMG / address.totalResidents;
      insidePercentage = (insidePercentage * 100).toFixed(0);
      insideHTML = `<div><b>${insidePercentage}%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    } else if (trueInside < 0) {
      insidePercentage = insideDMG / address.totalResidents;
      insidePercentage = (insidePercentage * 100).toFixed(0);
      insideHTML = `<div><b>${insidePercentage}%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    } else {
      insideHTML = `<div> <b>50%</b> of ${address.totalResidents} residents reported <b>inside damage</b></div>`;
    }

    if (trueParking > 0) {
      parkingPercentage = parkingDMG / address.totalResidents;
      parkingPercentage = (parkingPercentage * 100).toFixed(0);
      parkingHTML = `<div><b>${parkingPercentage}%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    } else if (trueParking < 0) {
      parkingPercentage = parkingDMG / address.totalResidents;
      parkingPercentage = (parkingPercentage * 100).toFixed(0);
      parkingHTML = `<div><b>${parkingPercentage}%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    } else {
      parkingHTML = `<div> <b>50%</b> of ${address.totalResidents} residents reported <b>parking lot damage</b></div>`;
    }

    const infowindow = new google.maps.InfoWindow({
      content: address_goog_link + insideHTML + parkingHTML
    });
    infoWindowArray.push(infowindow);
    marker.addListener("click", function() {
      for (i = 0; i < infoWindowArray.length; i++) {
        infoWindowArray[i].close();
      }
      infowindow.open(map, marker);
    });
  } else {
    // Location already has marker, check if icon should be updated
    for (i = 0; i < markerArray.length; i++) {
      if (
        markerArray[i].position.lat() === address.latlng.lat &&
        markerArray[i].position.lng() === address.latlng.lng
      ) {
        if (getMarkerIcon(totalFlood).url !== markerArray[i].getIcon().url) {
          markerArray[i].setIcon(getMarkerIcon(totalFlood));
        }
      }
    }
  }
}

function addNewMarker(id, addressArray) {
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

      for (const myID in heldAddresses) {
        if (
          heldAddresses[myID].formattedHeld === results[0].formatted_address
        ) {
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
        let insidePercentage;
        let parkingPercentage;
        let insideHTML;
        let parkingHTML;
        let trueInside = 0;
        let trueParking = 0;
        let insideDMG = 0;
        let parkingDMG = 0;
        for (id in heldAddresses) {
          if (
            heldAddresses[id].formattedHeld === results[0].formatted_address
          ) {
            trueInside += heldAddresses[id].totalInside;
            trueParking += heldAddresses[id].totalParking;
            if (heldAddresses[id].totalInside === 1) {
              insideDMG++;
            }
            if (heldAddresses[id].totalParking === 1) {
              parkingDMG++;
            }
          }
        }
        totalFlood = trueInside + trueParking;

        let encoded = results[0].formatted_address.replace(/ /g, "+");
        encoded = encoded.replace(/,/g, "");
        let search = "https://google.com/search?q=" + encoded;
        let address_goog_link =
          "<div>" +
          `<a href=${search} target = "_blank"> ${results[0].formatted_address} </a>` +
          "<div>";

        if (trueInside > 0) {
          insidePercentage = insideDMG / totalResidents;
          insidePercentage = (insidePercentage * 100).toFixed(0);
          insideHTML = `<div><b>${insidePercentage}%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        } else if (trueInside < 0) {
          insidePercentage = insideDMG / totalResidents;
          insidePercentage = (insidePercentage * 100).toFixed(0);
          insideHTML = `<div><b>${insidePercentage}%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        } else {
          insideHTML = `<div> <b>50%</b> of ${totalResidents} residents reported <b>inside damage</b></div>`;
        }

        if (trueParking > 0) {
          parkingPercentage = parkingDMG / totalResidents;
          parkingPercentage = (parkingPercentage * 100).toFixed(0);
          parkingHTML = `<div><b>${parkingPercentage}%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
        } else if (trueParking < 0) {
          parkingPercentage = parkingDMG / totalResidents;
          parkingPercentage = (parkingPercentage * 100).toFixed(0);
          parkingHTML = `<div><b>${parkingPercentage}%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
        } else {
          parkingHTML = `<div> <b>50%</b> of ${totalResidents} residents reported <b>parking lot damage</b></div>`;
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
            icon: getMarkerIcon(totalFlood),
            animation: google.maps.Animation.NONE
          });
          markerArray.push(marker);
          if (!isGoodOn && marker.getIcon().url === "./good.png") {
            marker.setVisible(false);
          }
          if (!isOkayOn && marker.getIcon().url === "./okay.png") {
            marker.setVisible(false);
          }
          if (!isBadOn && marker.getIcon().url === "./bad.png") {
            marker.setVisible(false);
          }
          markerLatLngArray.push([
            results[0].geometry.location.lat(),
            results[0].geometry.location.lng()
          ]);

          const infowindow = new google.maps.InfoWindow({
            content: address_goog_link + insideHTML + parkingHTML
          });
          infoWindowArray.push(infowindow);
          marker.addListener("click", function() {
            for (i = 0; i < infoWindowArray.length; i++) {
              infoWindowArray[i].close();
            }
            infowindow.open(map, marker);
          });
        } else {
          // Location already has marker, check if icon should be updated
          for (i = 0; i < markerArray.length; i++) {
            if (
              markerArray[i].position.lat() ===
                results[0].geometry.location.lat() &&
              markerArray[i].position.lng() ===
                results[0].geometry.location.lng()
            ) {
              if (
                getMarkerIcon(totalFlood).url !== markerArray[i].getIcon().url
              ) {
                markerArray[i].setIcon(getMarkerIcon(totalFlood));
              }
              infoWindowArray[i].setContent(
                address_goog_link + insideHTML + parkingHTML
              );
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

function changeLocation(location) {
  geoC.geocode(
    {
      address: location
    },
    function(results, status) {
      if (status === "OK") {
        map.setCenter(results[0].geometry.location);
      } else {
        console.log("This didnt work" + status);
      }
    }
  );
}

function resetHeight() {
  // reset the body height to that of the inner browser
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
// reset the height whenever the window's resized
// called to initially set the height.
resetHeight();
window.addEventListener("resize", resetHeight);

toggle = value => {
  switch (value) {
    case "good":
      isGoodOn = !isGoodOn;
      break;
    case "okay":
      isOkayOn = !isOkayOn;
      break;
    case "bad":
      isBadOn = !isBadOn;
      break;
  }
  for (i = 0; i < markerArray.length; i++) {
    if (markerArray[i].getIcon().url === "./" + value + ".png") {
      if (markerArray[i].getVisible()) {
        markerArray[i].setVisible(false);
        document.getElementById(value).style = "background: #999999";
      } else {
        markerArray[i].setVisible(true);
        document.getElementById(value).style = "background: ''";
      }
    }
  }
};

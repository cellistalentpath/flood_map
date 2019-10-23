// Initialize and add the map
function initMap() {
	var geoC = new google.maps.Geocoder();

	function codeAddress(geocoder, addressIn) {
		var address = addressIn;
		geocoder.geocode(
			{
				address: address
			},
			function(results, status) {
				if (status == "OK") {
					// var marker = new google.maps.Marker({
					// 	map: map,
					// 	position: results[0].geometry.location
					// });
					var map = new google.maps.Map(document.getElementById("map"), {
						zoom: 10,
						center: results[0].geometry.location
					});

					// some debug output
					console.log("status is: " + status);
					console.log(
						"results is: " + JSON.stringify(results[0].geometry.location)
					);
				} else {
					console.log("This didnt work" + status);
				}
			}
		);
	}

	codeAddress(geoC, "1400 S Post Oak, Houston, TX");
	//Swal.fire("Good job!", "You clicked the button!", "success");
}

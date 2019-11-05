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
					// var marker = new google.maps.Marker({
					// 	map: map,
					// 	position: results[0].geometry.location
					// });
					map = new google.maps.Map(document.getElementById("map"), {
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
	codeAddress("1400 S Post Oak, Houston, TX");
}

function addMarker() {
	var geoC = new google.maps.Geocoder();
	var address = document.getElementById("addressText").value;
	console.log(address);
	geoC.geocode(
		{
			address: address
		},
		function(results, status) {
			if (status == "OK") {
				var marker = new google.maps.Marker({
					map: map,
					position: results[0].geometry.location
				});

				// some debug output
				console.log("status is: " + status);
				console.log(
					"results is: " + JSON.stringify(results[0].geometry.location)
				);
			} else {
				console.log("This didnt work: " + status);
			}
		}
	);
}

//Swal.fire("Good job!", "You clicked the button!", "success");

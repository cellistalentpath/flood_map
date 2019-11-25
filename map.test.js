const { isLocationFree, getEverything, addMarker } = require("./map.js");

test("check that location is available", () => {
  expect(
    isLocationFree(
      [-80, -80],
      [
        [20, 20],
        [-81, -88],
        [40, 20]
      ]
    )
  ).toBe(true);
});

test("check that location is unavailable", () => {
  expect(
    isLocationFree(
      [-80, -80],
      [
        [20, 20],
        [-80, -80],
        [40, 20]
      ]
    )
  ).toBe(false);
});

test("check that our fetch call becomes an object", () => {
  fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));

  getEverything().then(res => {
    expect(res.data).toBe("12345");
  });

  expect(fetch.mock.calls.length).toEqual(1);
  expect(fetch.mock.calls[0][0]).toEqual(
    "http://99.26.184.205:4243/map/everything"
  );
});

// test("ensure add marker does not return null", () => {
//   expect(addMarker(0, "1400 S Post Oak Blvd, Houston, TX")).toBe(!null);
// });

"use strict";

const domain = "https://api.nasa.gov/mars-photos/api/v1/rovers";

const request = "?api_key=your_api_key";

const roverData = new Map();

// Asynchronous function to fetch JSON data
const getJson = async (url) => {
    // console.log(`Fetching URL: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please try again later.");
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error.message);
        $("#display").html(`<p class="error">${error.message}</p>`);
        return null;
    }
};

const getSelectedDate = () => {
    const year = $("#year").val();
    const month = $("#month").val();
    const date = $("#date").val();
    return `${year}-${month}-${date}`;
};

const clearPrevious = () => {
    $("#display").html("");
    $("#camera").html("");
    $("#year").html("");
    $("#month").html("");
    $("#date").html("");
};

const displayRoverData = (rover) => {
    $("#name").text(rover.name);
    $("#status").text(rover.status);
    $("#photos").text(rover.total_photos);
    $("#landing").text(rover.landing_date);
    $("#max").text(rover.max_date);
};

const getOptionHtml = (min, max, selected) => {
    let options = "";
    for (let i = min; i <= max; i++) {
        if (i == selected) {
            options += `<option selected>${i}</option>`;
        } else {
            options += `<option>${i}</option>`;
        }
    }
    return options;
};

$(document).ready(async () => {
    // Fetch rover data
    const url = domain + request;
    const json = await getJson(url); // asynchronous call to getJson()

    // Create options for dropdown and store rover data in Map
    let roverOptions = '<option></option>';
    for (let rover of json.rovers) {
        roverData.set(rover.name, rover);
        roverOptions += `<option>${rover.name}</option>`;
    }
    $("#rover").append(roverOptions);

    // Change event handler for rover dropdown
    $("#rover").change((evt) => {
        clearPrevious();

        // Get data for the selected rover
        const name = $(evt.currentTarget).val();
        const data = roverData.get(name);

        if (data) {
            // Display options if a rover is selected
            $("#options").show();
            displayRoverData(data);

            // Populate camera dropdown
            let cameraOptions = '<option value="">All Cameras</option>';
            for (let camera of data.cameras) {
                cameraOptions += `<option value="${camera.name}">${camera.full_name}</option>`;
            }
            $("#camera").append(cameraOptions);

            // Populate year, month, and date dropdowns based on date range
            const landingDateParts = data.landing_date.split("-");
            const maxDateParts = data.max_date.split("-");

            $("#year").append(
                getOptionHtml(landingDateParts[0], maxDateParts[0], maxDateParts[0])
            );
            $("#month").append(getOptionHtml(1, 12, maxDateParts[1]));
            $("#date").append(getOptionHtml(1, 31, maxDateParts[2]));
        } else {
            $("#options").hide();
        }
    });

    // Click event handler for "View Photos" button
    $("#view").click(async () => {
        $("#display").html("Loading...");

        // Get rover, date, and camera info and build API URL
        const rover = $("#rover").val();
        const date = getSelectedDate();
        const camera = $("#camera").val();

        let url = `${domain}/${rover}/photos/${request}&earth_date=${date}`;
        if (camera) {
            url += `&camera=${camera}`;
        }

        // Fetch and display photo data
        const json = await getJson(url);

        if (!json || !json.photos || json.photos.length === 0) {
            const message = camera
                ? `No photos for ${camera} camera on ${date}`
                : `No photos for ${date}`;
            $("#display").html(message);
        } else {
            let html = "";
            for (let photo of json.photos) {
                html += `<img src="${photo.img_src}" title="${photo.camera.full_name}">`;
            }
            $("#display").html(html);
        }
    });
});


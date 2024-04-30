import React, { useState, useEffect } from 'react';
import { Button, Modal, Box, Typography, TextField } from '@mui/material';
import { OpenAI } from 'openai';
import axios from 'axios'; // Import axios for making HTTP requests

const OPENAI_API_KEY = 'REPLACE_YOUR_API_KEY';
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function getLocation() {
  const response = await fetch("https://ipapi.co/json/?key=REPLACE_YOUR_API_KEY");
  const locationData = await response.json();
  return locationData;
}

async function getCurrentWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
  const response = await fetch(url);
  const weatherData = await response.json();
  return weatherData;
}

const RecommendationModal = () => {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [map, setMap] = useState(null);
  const [recommendationLocations, setRecommendationLocations] = useState([]);
  const [serpApiResults, setSerpApiResults] = useState([]);
  let mapMarkers = []; // Array to store map markers

  useEffect(() => {
    const fetchData = async () => {
      const locationData = await getLocation();
      setCurrentLocation(locationData);
      const weatherData = await getCurrentWeather(locationData.latitude, locationData.longitude);
      setCurrentWeather(weatherData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (open && map === null) {
      const timeout = setTimeout(() => {
        initializeMap();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [open, map]);

  useEffect(() => {
    if (map && recommendationLocations.length > 0) {
      createMarkers(map);
    }
  }, [map, recommendationLocations]);

  const convertCelsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
  };

  const agent = async (userInput) => {
    const availableTools = {
      getLocation,
      getCurrentWeather,
    };

    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant. Only use the functions you have been provided with.`,
      },
      {
        role: "user",
        content: userInput,
      },
    ];

    for (let i = 0; i < 5; i++) {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "getCurrentWeather",
              description: "Get the current weather in a given location",
              parameters: {
                type: "object",
                properties: {
                  latitude: {
                    type: "string",
                  },
                  longitude: {
                    type: "string",
                  },
                },
                required: ["longitude", "latitude"],
              },
            }
          },
          {
            type: "function",
            function: {
              name: "getLocation",
              description: "Get the user's location based on their IP address",
              parameters: {
                type: "object",
                properties: {},
              },
            }
          },
        ],
      });

      const { finish_reason, message } = response.choices[0];

      if (finish_reason === "tool_calls" && message.tool_calls) {
        const functionName = message.tool_calls[0].function.name;
        const functionToCall = availableTools[functionName];
        const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
        const functionArgsArr = Object.values(functionArgs);
        const functionResponse = await functionToCall.apply(null, functionArgsArr);

        messages.push({
          role: "function",
          name: functionName,
          content: `The result of the last function was this: ${JSON.stringify(functionResponse)}`,
        });
      } else if (finish_reason === "stop") {
        messages.push(message);
        return message.content;
      }
    }
    return "The maximum number of iterations has been met without a suitable answer. Please try again with a more specific input.";
  };

  const handleClick = async () => {
    setOpen(true);
    const response = await agent(
      "Generate three recommendations for Each restaurant, musical event, and sports event based on the current weather and location. formatted as follows:\n * Restaurant:\n * Name: [Name of restaurant]\n * Latitude: [Latitude of restaurant]\n * Longitude: [Longitude of restaurant]\n * Full Address [Full address of restaurant]\n * Description [Description of restaurant]\n * Musical Event:\n * Name [Name of musical event]\n * Latitude [Latitude of musical event]\n * Longitude [Longitude of musical event]\n * Full Address [Full address of musical event]\n * Description [Description of musical event]\n * Sports Event:\n * Name [Name of sports event]\n * Latitude [Latitude of sports event]\n * Longitude: [Longitude of sports event]\n * Full Address [Full address of sports event]\n * Description [Description of sports event]\n."
    );
    setResponse(response);
    const items = response.split('\n\n');

    // Function to extract Latitude and Longitude from each item
    const extractLatLng = (item) => {
      if (!item) {
        return { latitude: null, longitude: null }; // or handle the case where item is undefined/null
      }

      const lines = item.split('\n');
      const latitudeLine = lines.find(line => line.includes('Latitude'));
      const longitudeLine = lines.find(line => line.includes('Longitude'));

      if (!latitudeLine || !longitudeLine) {
        return { latitude: null, longitude: null }; // or handle the case where Latitude or Longitude lines are not found
      }

      const latitude = latitudeLine.split(':')[1].trim();
      const longitude = longitudeLine.split(':')[1].trim();
      return { latitude, longitude };
    };

    // Extract Latitude and Longitude for each item
    const latLngList = items.map(extractLatLng);
    setRecommendationLocations(latLngList);

    // Extract Name and call SerpAPI for each recommendation
    const extractName = (items) => {
      const names = [];
      items.forEach(item => {
        const lines = item.split('\n');
        const NameLine = lines.find(line => line.includes('Name:')); // Find the line containing "Full Address:"
        if (NameLine) {
          const name = NameLine.split(':')[1].trim(); // Split the line by ":" and take the second part
          names.push(name);
        }
      });
      return names;
    };
    const names = extractName(items);


    // Extract Full address and call SerpAPI for each recommendation
    const extractAddress = (items) => {
      const addresses = [];
      items.forEach(item => {
        const lines = item.split('\n');
        const addressLine = lines.find(line => line.includes('Full Address:')); // Find the line containing "Full Address:"
        if (addressLine) {
          const address = addressLine.split(':')[1].trim(); // Split the line by ":" and take the second part
          addresses.push(address);
        }
      });
      return addresses;
    };


    const  addresses = extractAddress(items);
    console.log(addresses)

    // Call your server-side endpoint for SerpAPI data
    const serpApiResults = await Promise.all(addresses.map(async (address) => {
      try {
        const response = await axios.get(`http://localhost:5000/serpapi?query=${encodeURIComponent(address)}`);
        return { address, hours: response.data?.answer_box.result || response.data?.events.date };
      } catch (error) {
        console.error("Error fetching data from SerpAPI:", error);  
        return { address, hours: '11 AM–9 PM'};
      }
    }));
    setSerpApiResults(serpApiResults);
  };

  const handleClose = () => {
    setOpen(false);
    setMap(null);
    setResponse('');
    setRecommendationLocations([]); // Clear recommendationLocations when closing the modal
    setSerpApiResults([]); // Clear SerpAPI results when closing the modal
  };

  const initializeMap = () => {
    if (!currentLocation) {
      console.log("Current location is not available yet.");
      return;
    }

    if (typeof window.google === 'undefined') {
      console.log("Google Maps API is not loaded yet.");
      return;
    }

    const mapCenter = { lat: currentLocation.latitude, lng: currentLocation.longitude };
    const mapElement = document.getElementById('google-map');
    if (!mapElement) {
      console.log("Map element not found.");
      return;
    }

    const mapOptions = {
      center: mapCenter,
      zoom: 10,
    };
    const newMap = new window.google.maps.Map(mapElement, mapOptions);
    setMap(newMap);

    // Green balloon for current location
    addMarker(newMap, mapCenter, 'You are Here', 'green', 'darkblue');
  };

  const addMarker = (map, position, label, color, textColor) => {
    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      icon: {
        url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        scaledSize: { width: 40, height: 40 }
      },
      label: {
        text: label,
        color: textColor
      }
    });
    return marker; // Return the marker
  };

  const createMarkers = (map) => {
    if (!map || !recommendationLocations) {
      return;
    }

    // Clear existing markers from the map
    mapMarkers.forEach(marker => {
      marker.setMap(null);
    });

    // Clear the mapMarkers array
    mapMarkers = [];

    // Define colors and labels for different types of events
    const colors = ['blue', 'yellow', 'red'];
    const labels = ['Restaurant', 'Music Event', 'Sports Event'];

    const bounds = new window.google.maps.LatLngBounds(); // Initialize bounds

    recommendationLocations.forEach(({ latitude, longitude }, index) => {
      if (latitude && longitude) {
        const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
        let color, label;
        if (index === 0) { // For the first location, always use the color and label of a restaurant
          color = 'blue';
          label = 'Restaurant 1';
        } else {
          color = colors[Math.floor((index - 1) / 3)]; // Change color every 3 markers, starting from index 1
          label = `${labels[Math.floor((index - 1) / 3)]} ${index % 3 === 0 ? 3 : index % 3}`; // Change label every 3 markers, starting from index 1
        }
        const marker = addMarker(map, position, label, color, 'black');
        mapMarkers.push(marker); // Add the marker to the mapMarkers array
        bounds.extend(position); // Extend bounds to include marker
      }
    });

    // Fit map to bounds
    map.fitBounds(bounds);
  };

  return (
    <>
      <Button variant="outlined" size="small" color="primary" onClick={handleClick}>
        Recommended For You
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 1000, height: 700, bgcolor: 'background.paper', boxShadow: 24, p: 4, overflow: 'auto' }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">Recommended For You</Typography>
          {/* Google Maps div */}
          <div id="google-map" style={{ width: '100%', height: '500px' }}></div>
          {/* Display current location and weather */}
          <Typography variant="body1" gutterBottom>
            Current Location: {currentLocation ? `${currentLocation.city}, ${currentLocation.country_name}` : 'Loading...'}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Current Weather: {currentWeather ? `${convertCelsiusToFahrenheit(currentWeather.hourly.apparent_temperature[0])}°F` : 'Loading...'}
          </Typography>
          {/* Display combined response */}
          <TextField
            fullWidth
            multiline
            rows={10}
            value={response ? `${response}\n\nSerpAPI Results:\n${serpApiResults.map(result => `${result.address} Hours: ${result.hours}`).join('\n')}` : "Loading Recommendation..."}
            disabled
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </Box>
      </Modal>
    </>
  );
  
};

export default RecommendationModal;

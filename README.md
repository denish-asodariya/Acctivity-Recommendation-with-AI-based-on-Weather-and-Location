# Activity Recommendation React Web App

This React web application provides real-time activity recommendations based on the user's current location and weather conditions. It utilizes the OpenAI Chat Completion API to generate recommendations for restaurants, musical events, and sports events. The recommendations are then displayed on a Google Map, along with the user's current location and information obtained from the SerpAPI for real-time search results.

## Features

- **Real-Time Recommendations**: Clicking on the "Recommended For You" button triggers the generation of recommendations using the OpenAI Chat Completion API. The recommendations include 3 restaurants, 3 musical events, and 3 sports events.
  
- **Google Map Integration**: A popup window appears displaying a Google Map with 10 markers:
  - Current user location (Green marker)
  - 3 markers for restaurants
  - 3 markers for musical events/concerts
  - 3 markers for sports events
  
- **Real-Time Data**: Real-time data for current weather conditions, events, and location of the user is fetched from various APIs:
  - Weather data is obtained from [Open-Meteo](https://open-meteo.com/) or [OpenWeatherMap](https://openweathermap.org/api)
  - User location is retrieved using [ipapi](https://ipapi.co/json/)
  - Real-time search results are fetched from [SerpAPI](https://serpapi.com/dashboard)
  
- **Customizable**: The application is built using React and Material UI, making it easy to customize and extend as per requirements.

## Installation and Usage

1. Replace all API keys in the `FetchRecommendation.js` (OpenAI Key) and `server.js` (SerpAPI Key) files, and in the `index.html` (Google Map API) file.
2. Run `npm install` to install dependencies.
3. Start the backend server by running `node server.js`.
4. Start the React app by running `npm start`.
5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode.
- `npm test`: Launches the test runner in interactive watch mode.
- `npm run build`: Builds the app for production to the `build` folder.
- `npm run eject`: Ejects the app from Create React App, allowing full control over configurations.

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Material-UI Documentation](https://mui.com/getting-started/usage/)

## Troubleshooting

If you encounter any issues or have questions, please refer to the documentation links provided above or reach out for support.

## Credits

This project was developed as part of a software development assignment, leveraging various APIs and technologies to deliver real-time activity recommendations to users.

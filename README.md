# 🌍 Weather Map App

A responsive React + TypeScript application that displays current and next-day weather forecasts for 20 random cities on a Mapbox-powered interactive world map.

## 🚀 Features

- 🌎 Interactive Map using Mapbox GL JS
- 🌤️ Weather forecast for today and tomorrow
- 🏙️ Sidebar with 20 random cities from across the world
- 🔍 Real-time search input to filter cities
- 📍 Clickable map markers for each city
- 💬 Popups displaying weather details when marker icons are clicked
- 📱 Fully responsive design for mobile, tablet, and desktop
- ⚡ Built with React + TypeScript
- 🚀 Deployed on GitHub Pages

## 🛠️ Tech Stack

- React (with Hooks)
- TypeScript
- Mapbox GL JS
- OpenWeatherMap API
- Vite
- CSS / SCSS
- GitHub Pages for deployment

## 📂 Folder Structure

weather-map/
├── public/
│   └── index.html
├── src/
│   ├── components/         # Reusable components
│   ├── data/               # City data (name, coordinates)
│   ├── services/           # Weather and map services
│   ├── types/              # TypeScript interfaces and types
│   ├── App.tsx             # Main app logic
│   └── main.tsx            # App entry point
├── .env                    # API keys
├── package.json
├── tsconfig.json
└── README.md

## 📦 Installation

To run the project locally:

1. Clone the repository:
   git clone https://github.com/Dereelcoder1/weather-map.git

2. Navigate to the project directory:
   cd weather-map

3. Install dependencies:
   npm install

4. Start the development server:
   npm run dev

5. Visit http://localhost:5173/ in your browser

## 🔐 Environment Variables

You can get your keys from:
- Mapbox: https://account.mapbox.com/
- OpenWeatherMap: https://home.openweathermap.org/api_keys

## 📤 Deployment

The project is deployed using GitHub Pages.

Make sure your package.json contains:

"homepage": "https://dereelcoder1.github.io/weather-map/",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

To deploy:

1. Install gh-pages:
   npm install --save gh-pages

2. Build and deploy:
   npm run build
   npm run deploy

## 💡 How It Works

- The sidebar loads 20 pre-selected cities.
- Typing into the input filters the visible list of cities.
- Clicking a city zooms the map to its location and shows an info icon.
- Clicking the info icon displays a popup with:
  - Today's weather
  - Tomorrow's weather
  - Temperature, conditions, and location name

## ✅ Requirements Checklist

- ✅ Built with React.js and TypeScript
- ✅ Deployed live
- ✅ Mapbox integrated
- ✅ Displays 20 random cities
- ✅ Search/filter functionality
- ✅ City markers on the map
- ✅ Weather popup with today/tomorrow forecast
- ✅ Responsive on all screen sizes
- ✅ Public GitHub repository

## 👤 Author

Akorede Tolani Temidayo  
GitHub: https://github.com/Dereelcoder1

## 📃 License

This project is licensed under the MIT License.

## 📬 Feedback

For issues or feature requests, feel free to open an issue on the GitHub repository:

https://github.com/Dereelcoder1/weather-map/issues

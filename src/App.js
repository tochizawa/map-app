import /** React ,*/ { useState /** , useEffect */ } from "react";
import { geoPath, geoMercator /**, geoEqualEarth*/ } from "d3-geo";
import { feature } from "topojson-client";
import isoCountries from "i18n-iso-countries";
import countries from "world-countries";
// http://y-uti.hatenablog.jp/entry/2014/02/09/071953
// https://github.com/vega/vega/blob/master/docs/data/world-110m.json
import worldData from "./world-110m.json";
import Pin from "./Pin";

const scale = 200;
const cx = 800;
const cy = 450;
const unSelectedColor = "rgba(255, 255, 255, 1)";
const selectedColor = "rgba(40,83,107, 0.5)";

const defaultCountries = [
  "JPN",
  "USA"
];

// mercator
const projectMercator = () => geoMercator()
    .scale(cx / ((2 * Math.PI * (360 - 0)) / 360))
    .center([0, 0])
    .translate([cx / 2, cy / 2]);

// equal earth
// const projection = geoEqualEarth().scale(scale).translate([cx, cy]).rotate([0, 0]);

const pinCoordinates = (countryKey) => {
  const country = countries.find((c) => c.cca3 === countryKey);
  if(!country || !country.latlng) {
    return null;
  }
  const reverse = country.latlng.slice().reverse();
  if(!isFinite(reverse[0]) || !isFinite(reverse[1])) {
    return null;
  }
  return reverse;
}

const defaultPins = defaultCountries.reduce((acc, countryKey) => {
  const coordinates = pinCoordinates(countryKey);
  if (!coordinates) {
    return acc;
  }
  return [...acc, { countryKey, coordinates }];
}, []);

const fillCountry = (numericId, countryKey) => {
  const thisCountryKey = isoCountries.numericToAlpha3(numericId);
  if(!thisCountryKey) {
    return unSelectedColor;
  }
  if(defaultCountries.includes(thisCountryKey)) {
    return selectedColor;
  }
  if(countryKey ==="ATA") {
    return unSelectedColor;
  }
  return thisCountryKey === countryKey ? selectedColor : unSelectedColor;
};

const App = () => {
  const [countryKey, setCountryKey] = useState("");
  const geographies = feature(worldData, worldData.objects.countries).features;
  return (
    <div className="App">
      <svg width={scale * 3} height={scale * 3} viewBox={`0 0 ${cx} ${cy}`}>
        <g>
          {geographies.map((d, i) => (
            <path
              key={`path-${i}`}
              d={geoPath().projection(projectMercator())(d)}
              fill={`${fillCountry(d.id, countryKey)}`}
              stroke="#000000"
              strokeWidth={0.8}
              onMouseOver={() => setCountryKey(isoCountries.numericToAlpha3(d.id))}
            />
          ))}
        </g>
        <g>
          {defaultPins.map((pins) => (
            <Pin
              key={`pin-${pins.countryKey}`}
              x={projectMercator()(pins.coordinates)[0]}
              y={projectMercator()(pins.coordinates)[1]} />
          ))}
          {(countryKey && !defaultCountries.includes(countryKey) && countryKey !=="ATA") &&
            <Pin
              key={`pin-hover-${countryKey}`}
              x={projectMercator()(pinCoordinates(countryKey) || [0, 0])[0]}
              y={projectMercator()(pinCoordinates(countryKey) || [0, 0])[1]} />
          }
        </g>
      </svg>
    </div>
  );
}

export default App;

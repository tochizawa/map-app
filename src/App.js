import /** React ,*/ { useState, useRef /** , useEffect */ } from "react";
import { geoPath, geoMercator /**, geoEqualEarth*/ } from "d3-geo";
import { feature } from "topojson-client";
import countries from "world-countries";
import Modal from "react-modal";
import worldData from "./admin_0_countries.json";
import Pin from "./Pin";

import "./App.css"

const cx = 800;
const cy = 450;
const unSelectedColor = "rgba(255, 255, 255, 1)";
const selectedColor = "rgba(40,83,107, 0.5)";
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

const defaultCountries = [
  "USA"
];

const geographies = feature(worldData, worldData.objects.countries).features || [];
const selectors = geographies.filter(v=> v.properties.ISO_A3 !== "-99").map(v => ({ code: v.properties.ISO_A3, name: v.properties.NAME_JA }));

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

const fillCountry = (properties, countryKey) => {
  const thisCountryKey = properties ? properties.ISO_A3 : null;
  if(!thisCountryKey) {
    return unSelectedColor;
  }
  if(defaultCountries.includes(thisCountryKey)) {
    return selectedColor;
  }
  return thisCountryKey === countryKey ? selectedColor : unSelectedColor;
};

export default function App() {
  const [scale, setScale] = useState(2.5);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const [countryKey, setCountryKey] = useState("");
  const [modalIsOpen, setIsOpen] = useState(false);

  const tbodyRef = useRef(null);

  // mercator
  const projectMercator = () => geoMercator()
      .scale(cx / scale / Math.PI)
      .rotate([0, 0])
      .center([0, 45])
      .translate([cx / 2, cy / 2]);

// // equal earth
// const projection = geoEqualEarth().scale(scale).translate([cx, cy]).rotate([0, 0]);

  return (
    <div className="App">
      <div className="list">
        <table>
          <thead>
            <tr>
              <th>ISO3</th>
              <th>国名</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {selectors.map(v => (
              <tr
                key={v.code}
                onMouseOver={()=> {
                  const [x, y] = projectMercator()(pinCoordinates(v.code));
                  setX(x-250);
                  setY(y-150);
                  setCountryKey(v.code);
                }}
                onDoubleClick={()=> setIsOpen(true)}
              >
                <td>{v.code}</td>
                <td>{v.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="map">
        <svg
          viewBox={`${x} ${y} ${cx} ${cy}`}
          onWheel={event => setScale(prev => {
            if((prev < 0.5 && event.deltaY < 0) || (5 < prev && 0 <= event.deltaY)) {
              return prev;
            }
            return event.deltaY < 0 ? prev - 0.2 : prev + 0.2
          })}
          onMouseDown={() => setIsDrag(true)}
          onMouseMove={event => {
            if(isDrag) {
              const { movementX, movementY } = event;
              setX(prev => movementX * -0.3 + prev);
              setY(prev => movementY * -0.3 + prev);
            }
          }}
          onMouseUp={() => setIsDrag(false)}
          onMouseLeave={() => setIsDrag(false)}
          // onTouchStart={event => console.log("onTouchStart", event)}
          // onTouchMove={event => console.log("onTouchMove", event)}
          // onTouchEnd={event => console.log("onTouchEnd", event)}
        >
          <g>
            {geographies.map((d, i) => (
              <path
                key={`path-${i}`}
                d={geoPath().projection(projectMercator())(d)}
                fill={`${fillCountry(d.properties, countryKey)}`}
                stroke="#000000"
                strokeWidth={0.8}
                onClick={() => {
                  tbodyRef.current.scrollTop = (23 * i) + (1 * i);
                  setCountryKey(d.properties.ISO_A3);
                }}
                onDoubleClick={() => setIsOpen(true)}
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
            {(countryKey && !defaultCountries.includes(countryKey)) &&
              <Pin
                key={`pin-hover-${countryKey}`}
                x={projectMercator()(pinCoordinates(countryKey) || [0, 0])[0]}
                y={projectMercator()(pinCoordinates(countryKey) || [0, 0])[1]} />
            }
          </g>
          <text x={cx+x-100} y={cy+y} fontSize="5">Made with Natural Earth.</text>
        </svg>
      </div>
      <Modal appElement={document.getElementById("root")} isOpen={modalIsOpen} style={customStyles}>
        <button onClick={() => setIsOpen(false)}>Close Modal</button>
        <h2>selected country</h2>
        <p>{countryKey}: {selectors.find(v=>v.code === countryKey)?.name}</p>
      </Modal>
    </div>
  );
}

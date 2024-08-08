import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import payload from "../payload.json";
import "../styles/MapComponent.css";

const getJetColor = (value) => {
  const colors = [
    "#00007F", // Dark Blue
    "#0000FF", // Blue
    "#007FFF", // Light Blue
    "#00FFFF", // Cyan
    "#7FFF7F", // Light Green
    "#FFFF00", // Yellow
    "#FF7F00", // Orange
    "#FF0000", // Red
    "#7F0000", // Dark Red
  ];
  const normalizedValue = (value - 1) / 14;
  const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
  return colors[colorIndex];
};

const MapComponent = () => {
  const mapRef = useRef(null);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(15);
  const totalTime = 20; // visualization time
  const totalPoints = payload.detections[0].points.length;
  // console.log("total points", totalPoints);
  // const pointsPerInterval = 100;
  // const intervalTime = (totalTime * 1000) / (totalPoints / pointsPerInterval);
  const intervalTime = (totalTime * 1000) / totalPoints; // interval time milliseconds

  useEffect(() => {
    const polygonCoords = payload.polygon.map((coord) => [
      coord.latitude,
      coord.longitude,
    ]);
    const map = L.map(mapRef.current).setView(
      [polygonCoords[0][0], polygonCoords[0][1]],
      currentZoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.polygon(polygonCoords).addTo(map);

    const heatLayer = L.layerGroup();
    heatLayer.addTo(map);
    setHeatmapLayer(heatLayer);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);
    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });
    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!heatmapLayer) return;

    let currentTime = 0;
    const maxTime = payload.detections.length - 1;

    const interval = setInterval(() => {
      heatmapLayer.clearLayers();
      const markers = payload.detections[currentTime].points.map((point) => {
        const circle = L.circleMarker([point.latitude, point.longitude], {
          radius: 6,
          fillColor: getJetColor(point.value),
          color: getJetColor(point.value),
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
        return circle;
      });

      markers.forEach((marker) => marker.addTo(heatmapLayer));
      currentTime = (currentTime + 1) % (maxTime + 1);
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [heatmapLayer, currentZoom]);

  return <div ref={mapRef} className="map-container"></div>;
};

export default MapComponent;

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapController({
  userLocation,
  places,
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const points = [
      [
        userLocation.latitude,
        userLocation.longitude,
      ],
      ...places.map((place) => [
        place.latitude,
        place.longitude,
      ]),
    ];

    if (points.length === 1) {
      map.setView(
        points[0],
        14,
        {
          animate: true,
        }
      );

      return;
    }

    map.fitBounds(
      points,
      {
        padding: [40, 40],
        maxZoom: 14,
        animate: true,
      }
    );
  }, [
    map,
    userLocation,
    places,
  ]);

  return null;
}

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Package, Truck, Phone, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

// Convert latitude/longitude to OpenStreetMap tile coordinates
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(
    (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * n
  );
  return { x, y };
}

export default function Redistribution() {
  const [ngos, setNgos] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [bestMatchId, setBestMatchId] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [isLocating, setIsLocating] = useState(true);

  // Get real location and fetch NGOs
  useEffect(() => {
    fetchRealNgos();
  }, []);

  const fetchRealNgos = () => {
    setIsLocating(true);
    setNgos([]);
    setBestMatchId(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLoc({ lat, lon });

          try {
            const response = await fetch('http://localhost:8000/api/find-ngos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lon })
            });
            const data = await response.json();
            if (data.ngos) {
              setNgos(data.ngos);
            }
          } catch (error) {
            console.error("Error fetching real NGOs:", error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback location if permission denied
          setUserLoc({ lat: 51.505, lon: -0.09 }); 
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleDispatch = async () => {
    setIsMatching(true);
    try {
      const response = await fetch('http://localhost:8000/api/ngo-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surplus_quantity: 45, // Example: we would pull real state here in prod
          ngos: ngos
        })
      });
      const data = await response.json();
      if (data.selected_ngo) {
        setBestMatchId(data.selected_ngo.id);
      }
    } catch (error) {
      console.error("NGO Match Error:", error);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            NGO Redistribution Network
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Find and coordinate with nearby partners for surplus food pickup.
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0 flex gap-2">
          <button
            type="button"
            onClick={fetchRealNgos}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
            Refresh Location
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={isMatching || isLocating || ngos.length === 0}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
          >
            {isMatching ? 'Matching...' : (
              <>
                <Truck className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Auto-Dispatch
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        {/* NGO List */}
        <div className="bg-white shadow rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Available Partners</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLocating ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Acquiring current location & finding real NGOs...</p>
              </div>
            ) : ngos.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No NGOs found nearby.</div>
            ) : (
              ngos.map((ngo) => (
                <div key={ngo.id} className={`border rounded-lg p-4 transition-colors flex flex-col sm:flex-row gap-4 ${
                bestMatchId === ngo.id ? 'border-green-500 bg-green-50 ring-2 ring-green-500' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-primary-300'
              }`}>
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-primary-100 text-primary-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-gray-900 truncate">{ngo.name}</h4>
                    {bestMatchId === ngo.id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Best Match
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500 gap-4">
                    <span className="flex items-center"><Navigation className="mr-1 h-4 w-4" /> {ngo.distance} ({ngo.time})</span>
                    <span className="flex items-center"><Package className="mr-1 h-4 w-4" /> Capacity: {ngo.capacity} meals</span>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 justify-center sm:justify-start mt-2 sm:mt-0">
                  <a href={`tel:${ngo.phone || '+1-555-012-3456'}`} className="inline-flex justify-center items-center rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex-1 sm:flex-none">
                    <Phone className="h-4 w-4 text-gray-400 sm:mr-1" />
                    <span className="hidden sm:inline">Contact</span>
                  </a>
                  <button type="button" className={`inline-flex justify-center items-center rounded px-2 py-1 text-sm font-semibold shadow-sm flex-1 sm:flex-none border ${
                    bestMatchId === ngo.id ? 'bg-green-600 text-white hover:bg-green-700 border-green-700' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200'
                  }`}>
                    {bestMatchId === ngo.id ? 'Dispatch Now' : 'Arrange Pickup'}
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Dynamic Map */}
        <div className="bg-blue-50 rounded-lg shadow border border-gray-200 overflow-hidden relative min-h-[400px]">
          {userLoc && (
            <div 
              className="absolute inset-0 opacity-60 bg-cover bg-center transition-all duration-1000" 
              style={{ 
                backgroundImage: `url('https://tile.openstreetmap.org/13/${latLonToTile(userLoc.lat, userLoc.lon, 13).x}/${latLonToTile(userLoc.lat, userLoc.lon, 13).y}.png')` 
              }}
            ></div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
             {/* Map Placeholders */}
             <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
               <MapPin className="h-8 w-8 text-red-500 drop-shadow-md animate-bounce" fill="white" />
               <span className="bg-white px-2 py-1 text-xs font-bold rounded shadow mt-1">Surplus Source (Cafeteria)</span>
             </div>

             <div className="absolute top-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
               <MapPin className="h-6 w-6 text-primary-600 drop-shadow-md" fill="white" />
               <span className="bg-white/90 px-2 py-1 text-xs font-semibold rounded shadow mt-1 text-gray-700">FoodBank Trust</span>
             </div>

             <div className="absolute bottom-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
               <MapPin className="h-6 w-6 text-primary-600 drop-shadow-md" fill="white" />
               <span className="bg-white/90 px-2 py-1 text-xs font-semibold rounded shadow mt-1 text-gray-700">Helping Hands</span>
             </div>
             
             {/* Map connection lines simulating routes */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
               <path d="M 25% 25% Q 50% 10% 75% 33%" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5" fill="none" />
             </svg>
          </div>

          <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-sm font-medium flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Source Location
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-600"></span> NGO Partners
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap, Marker } from 'react-leaflet';
import { Coordinates, CommentData, PointType, OfficialPOI } from '../types';
import { Layers, Navigation, Check, MapPin, Landmark, AlertCircle, Search, X, Sparkles, Wrench, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

interface MapViewProps {
  comments: CommentData[];
  pois: OfficialPOI[];
  onMapClick: (coords: Coordinates) => void;
  onPOIClick: (poi: OfficialPOI) => void;
  center: Coordinates;
  onRegionChange?: (bounds: L.LatLngBounds) => void;
}

// Map Tile Providers
const TILE_LAYERS = {
  OSM: {
    name: '标准地图 (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  GAODE: {
    name: '高德地图',
    url: 'https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution: '&copy; AutoNavi'
  },
  SATELLITE: {
    name: '卫星影像',
    url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attribution: '&copy; AutoNavi'
  }
};

const LocationMarker = ({ onMapClick }: { onMapClick: (coords: Coordinates) => void }) => {
  useMapEvents({
    click(e) {
      setTimeout(() => {
          onMapClick(e.latlng);
      }, 50);
    },
  });
  return null;
};

const MapRegionListener = ({ onChange }: { onChange?: (bounds: L.LatLngBounds) => void }) => {
  const map = useMap();
  
  // Initial bounds
  useEffect(() => {
    if (onChange) {
      onChange(map.getBounds());
    }
  }, [map, onChange]);

  useMapEvents({
    moveend: () => {
      if (onChange) {
        onChange(map.getBounds());
      }
    }
  });
  return null;
};

const MapControls = ({ 
  currentLayer, 
  setCurrentLayer, 
  onLocate 
}: { 
  currentLayer: string, 
  setCurrentLayer: (k: string) => void,
  onLocate: () => void 
}) => {
  const [showLayers, setShowLayers] = useState(false);

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3" onClick={stopPropagation}>
      <div className="relative">
        <button 
          onClick={() => setShowLayers(!showLayers)}
          className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <Layers size={20} />
        </button>

        {showLayers && (
          <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">选择底图</h4>
            <div className="space-y-1">
              {Object.entries(TILE_LAYERS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentLayer(key);
                    setShowLayers(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    currentLayer === key ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {config.name}
                  {currentLayer === key && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={onLocate}
        className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        title="定位到我的位置"
      >
        <Navigation size={20} className="fill-current" />
      </button>
    </div>
  );
};

const MapSearch = ({ pois, onSelect }: { pois: OfficialPOI[], onSelect: (coords: Coordinates) => void }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<OfficialPOI[]>([]);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Real-time filtering
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const lowerQuery = query.toLowerCase();
        const filtered = pois.filter(p => p.name.toLowerCase().includes(lowerQuery));
        setResults(filtered);
    }, [query, pois]);

    // Handle clicking outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    };

    const handleSelect = (poi: OfficialPOI) => {
        setQuery(poi.name);       // Auto-fill name
        setShowResults(false);    // Clear result list
        onSelect(poi.coords);     // Trigger location change
    };

    return (
        <div ref={wrapperRef} className="absolute top-4 left-4 z-[1000] w-64 font-sans" onClick={stopPropagation}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-10 pr-10 py-3 rounded-xl shadow-lg border border-gray-100 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white/95 backdrop-blur-sm transition-all"
                    placeholder="搜索景点..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => { if(query) setShowResults(true); }}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                {query && (
                    <button 
                        onClick={() => {setQuery(''); setResults([]);}} 
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            {showResults && results.length > 0 && (
                <div className="mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                    {results.map(poi => (
                        <div
                            key={poi.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3"
                            onClick={() => handleSelect(poi)}
                        >
                            <div className="p-1 bg-purple-50 rounded text-purple-600 shrink-0">
                                <Landmark size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-700 truncate">{poi.name}</div>
                                <div className="text-[10px] text-gray-400 truncate">{poi.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MapFlyTo = ({ coords }: { coords: Coordinates | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 16, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="user-location-marker w-4 h-4"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const poiIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div class="bg-purple-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform -translate-x-1/2 -translate-y-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M12 6H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H12"></path></svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34]
});


export const MapView: React.FC<MapViewProps> = ({ comments, pois, onMapClick, onPOIClick, center, onRegionChange }) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentLayerKey, setCurrentLayerKey] = useState<string>('OSM');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const handleLocateUser = () => {
    if (isLocating) return;
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("当前浏览器不支持地理定位功能。");
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        setFlyToLocation({ ...coords }); // Force new reference to trigger effect
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        if (error.code === 1) { // PERMISSION_DENIED
             setLocationError("定位失败：请在系统设置中允许浏览器访问您的位置信息。");
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
             setLocationError("定位失败：位置信息不可用，请检查网络或GPS。");
        } else if (error.code === 3) { // TIMEOUT
             setLocationError("定位超时，请稍后再试。");
        } else {
             setLocationError("获取位置时发生未知错误。");
        }
        setIsLocating(false);
        // Auto hide error after 5 seconds
        setTimeout(() => setLocationError(null), 5000);
      },
      { timeout: 10000 }
    );
  };

  const handleSearchSelect = (coords: Coordinates) => {
      setFlyToLocation({ ...coords }); // Force new reference
  };

  const activeLayer = TILE_LAYERS[currentLayerKey as keyof typeof TILE_LAYERS];

  const renderRatingBar = (label: string, score: number) => (
      <div className="flex items-center gap-2 text-xs mb-1">
          <span className="w-16 text-gray-500">{label}</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#07C160]" style={{ width: `${score * 10}%` }}></div>
          </div>
          <span className="w-4 text-right font-mono text-gray-700">{score}</span>
      </div>
  );

  if (!mapReady) return <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">加载地图中...</div>;

  return (
    <div className="w-full h-full relative z-0">
      
      {/* Geolocation Error Notification Toast */}
      {locationError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-orange-50 border border-orange-200 shadow-xl rounded-xl p-3 z-[1500] animate-in slide-in-from-top-4 flex items-start gap-3">
              <AlertTriangle className="text-orange-500 shrink-0" size={20} />
              <div className="flex-1">
                  <h5 className="text-sm font-bold text-orange-800 mb-1">无法获取位置</h5>
                  <p className="text-xs text-orange-700 leading-tight">{locationError}</p>
              </div>
              <button onClick={() => setLocationError(null)} className="text-orange-400 hover:text-orange-600">
                  <X size={16} />
              </button>
          </div>
      )}

      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          key={currentLayerKey}
          attribution={activeLayer.attribution}
          url={activeLayer.url}
        />
        
        <LocationMarker onMapClick={onMapClick} />
        <MapRegionListener onChange={onRegionChange} />
        
        <MapControls currentLayer={currentLayerKey} setCurrentLayer={setCurrentLayerKey} onLocate={handleLocateUser} />
        <MapSearch pois={pois} onSelect={handleSearchSelect} />
        
        <MapFlyTo coords={flyToLocation} />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup><div className="text-center"><strong className="text-blue-600">您的位置</strong></div></Popup>
          </Marker>
        )}

        {/* Official POIs */}
        {pois.map(poi => (
            <Marker 
                key={poi.id} 
                position={poi.coords} 
                icon={poiIcon}
                eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); } }}
            >
                <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px]">
                        <h3 className="font-bold text-lg text-purple-700 mb-1 flex items-center gap-1"><Landmark size={16}/> {poi.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{poi.description}</p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onPOIClick(poi); }}
                            className="w-full bg-purple-600 text-white text-xs py-2 rounded-lg hover:bg-purple-700 font-medium"
                        >
                            评价打分 / 问题反馈
                        </button>
                    </div>
                </Popup>
            </Marker>
        ))}

        {/* User Comments */}
        {comments.map((comment) => {
          const isIssue = comment.pointType === PointType.ISSUE_REPORT;
          const color = isIssue ? '#EF4444' : '#07C160';

          return (
            <CircleMarker
              key={comment.id}
              center={comment.coords}
              pathOptions={{ color: 'white', fillColor: color, fillOpacity: 0.9, weight: 2 }}
              radius={isIssue ? 10 : 8} // Issues are slightly larger
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); } }}
            >
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2 border-b pb-1">
                    <span className={`text-xs font-bold truncate max-w-[150px] ${isIssue ? 'text-red-600' : 'text-gray-800'}`}>
                        {isIssue && <AlertCircle size={12} className="inline mr-1" />}
                        {comment.targetName || (isIssue ? '问题点位' : '自选点位')}
                    </span>
                    {!isIssue && (
                        <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 rounded">
                            {comment.averageScore}分
                        </span>
                    )}
                    {isIssue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">问题反馈</span>}
                  </div>
                  
                  {!isIssue ? (
                      <div className="mb-3 space-y-0.5">
                        {renderRatingBar('休闲娱乐', comment.ratings.recreational)}
                        {renderRatingBar('资源环境', comment.ratings.environmental)}
                        {renderRatingBar('历史文化', comment.ratings.historical)}
                        {renderRatingBar('经济价值', comment.ratings.economic)}
                        {renderRatingBar('情感联系', comment.ratings.emotional)}
                      </div>
                  ) : (
                      <div className="mb-3 flex flex-wrap gap-1">
                          {comment.issueTags?.map(tag => (
                              <span key={tag} className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                      </div>
                  )}

                  <p className="text-sm text-gray-700 mb-2 italic">"{comment.text}"</p>
                  
                  {comment.aiAnalysis && (
                    <div className={`mt-2 p-2 rounded text-[10px] border leading-relaxed shadow-sm ${
                        isIssue 
                        ? 'bg-red-50 border-red-100 text-red-900' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-900'
                    }`}>
                      <strong className={`block mb-1 flex items-center gap-1.5 ${
                          isIssue ? 'text-red-700' : 'text-indigo-700'
                      }`}>
                         {isIssue ? <Wrench size={12} /> : <Sparkles size={12} />}
                         AI {isIssue ? '整改建议' : '规划分析'}:
                      </strong>
                      {comment.aiAnalysis}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Legend - Moved down to avoid overlap with Search */}
      <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[900] text-xs space-y-2 border border-gray-200 pointer-events-none">
        <h4 className="font-bold text-gray-600 mb-1">图例</h4>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600 border border-white"></div> 
            <span>景点/POI</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#07C160] border border-white"></div> 
            <span>价值评价点</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] border border-white"></div> 
            <span>问题/隐患点</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10AEFF] border border-white"></div> 
            <span>当前位置</span>
        </div>
      </div>
    </div>
  );
};
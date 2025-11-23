import React, { useState, useMemo } from 'react';
import { AppView, CommentData, PointType, Coordinates, RatingValues, OfficialPOI } from './types';
import { MapView } from './components/MapView';
import { StatsView } from './components/StatsView';
import { ListView } from './components/ListView';
import { InputModal } from './components/InputModal';
import { analyzeComment } from './services/geminiService';
import { Map, BarChart2, List, Plus, Info } from 'lucide-react';
import L from 'leaflet';

// Wuyishan Official POIs
const OFFICIAL_POIS: OfficialPOI[] = [
    { id: 'poi-1', name: '天游峰', coords: { lat: 27.6371, lng: 117.9391 }, description: '武夷山第一胜地，云海梯田绝佳观赏点' },
    { id: 'poi-2', name: '九曲溪竹筏码头', coords: { lat: 27.6202, lng: 117.9305 }, description: '竹筏漂流起点，武夷山灵魂所在' },
    { id: 'poi-3', name: '大红袍景区', coords: { lat: 27.6605, lng: 117.9608 }, description: '母树大红袍所在地，茶文化核心' },
    { id: 'poi-4', name: '水帘洞', coords: { lat: 27.6701, lng: 117.9703 }, description: '武夷山最大洞穴，飞瀑流泉' },
    { id: 'poi-5', name: '武夷宫', coords: { lat: 27.6452, lng: 117.9554 }, description: '历代帝王祭祀武夷君的地方，宋街所在地' },
];

const INITIAL_DATA: CommentData[] = [
  {
    id: '1',
    pointType: PointType.OFFICIAL_POI,
    targetName: '天游峰',
    text: "景色非常壮观，但是爬山路窄，节假日人太多了。",
    coords: { lat: 27.6380, lng: 117.9400 },
    timestamp: Date.now() - 10000000,
    author: '游客A',
    ratings: { recreational: 9, environmental: 9, historical: 8, economic: 6, emotional: 7 },
    averageScore: 7.8,
    aiAnalysis: "具有极高的自然景观价值，但承载力在高峰期面临挑战。"
  },
  {
    id: '2',
    pointType: PointType.ISSUE_REPORT,
    targetName: '景区入口附近',
    text: "这里的垃圾桶满了没人清理，气味很难闻。",
    coords: { lat: 27.6460, lng: 117.9560 },
    timestamp: Date.now() - 5000000,
    author: '市民B',
    ratings: { recreational: 0, environmental: 0, historical: 0, economic: 0, emotional: 0 }, // Irrelevant for issue
    issueTags: ['卫生差', '设施损坏'],
    averageScore: 0,
    aiAnalysis: "建议增加环卫频次，并在主要人流节点增设分类垃圾桶。"
  }
];

const WelcomeOverlay = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-300">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-[#07C160] mb-4 mx-auto">
        <Info size={28} />
      </div>
      <h2 className="text-xl font-bold text-gray-800 text-center mb-4">欢迎来到 PPGIS 实验平台</h2>
      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 leading-relaxed mb-6 border border-gray-100">
        <p className="indent-6 text-justify">
          本平台致力于探索公众参与城市规划的新模式。目前处于<strong>开发测试阶段</strong>，旨在通过地图交互与AI技术，收集市民对空间环境的真实感知与建议，共同构建更美好的城市空间。
        </p>
      </div>
      <button 
        onClick={onDismiss}
        className="w-full py-3.5 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-xl font-bold text-sm shadow-lg shadow-green-200 transition-all active:scale-95"
      >
        开始体验
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MAP);
  const [comments, setComments] = useState<CommentData[]>(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [activePOIName, setActivePOIName] = useState<string | undefined>(undefined);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  
  // Wuyishan Center
  const [mapCenter] = useState<Coordinates>({ lat: 27.6452, lng: 117.9554 });

  // Filter Data based on Map Region (Performance Optimization)
  const visiblePois = useMemo(() => {
    if (!mapBounds) return OFFICIAL_POIS;
    return OFFICIAL_POIS.filter(poi => mapBounds.contains(poi.coords));
  }, [mapBounds]);

  const visibleComments = useMemo(() => {
    if (!mapBounds) return comments;
    return comments.filter(c => mapBounds.contains(c.coords));
  }, [mapBounds, comments]);

  const handleMapClick = (coords: Coordinates) => {
    setTempCoords(coords);
    setActivePOIName(undefined); // Reset POI name for custom points
    setIsModalOpen(true);
  };

  const handlePOIClick = (poi: OfficialPOI) => {
    setTempCoords(poi.coords); // Use POI coords
    setActivePOIName(poi.name);
    setIsModalOpen(true);
  }

  const handleRegionChange = (bounds: L.LatLngBounds) => {
    setMapBounds(bounds);
  };

  const handleAddComment = async (text: string, ratings: RatingValues, type: PointType, tags?: string[]) => {
    if (!tempCoords) return;

    const avg = Object.values(ratings).reduce((a, b) => a + b, 0) / 5;

    // 1. Optimistic UI Update
    const newComment: CommentData = {
      id: Date.now().toString(),
      pointType: type,
      targetName: activePOIName || (type === PointType.ISSUE_REPORT ? undefined : '自选位置'),
      text,
      coords: tempCoords,
      timestamp: Date.now(),
      author: '我',
      ratings: ratings,
      averageScore: type === PointType.ISSUE_REPORT ? 0 : parseFloat(avg.toFixed(1)),
      issueTags: tags,
      aiAnalysis: '正在进行智能分析...' 
    };

    setComments(prev => [...prev, newComment]);

    // 2. Call AI Service
    try {
        const analysis = await analyzeComment(text, ratings, type, tags);
        
        // 3. Update with AI results
        setComments(prev => prev.map(c => 
            c.id === newComment.id ? { ...c, ...analysis } : c
        ));
    } catch (e) {
        console.error("AI Analysis failed silently", e);
    }
  };

  const NavButton = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
        currentView === view ? 'text-[#07C160]' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-[#F5F5F5] overflow-hidden">
      
      {showWelcome && <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />}

      {/* Header */}
      <div className="h-12 bg-white flex items-center justify-center border-b border-gray-100 shadow-sm z-20 shrink-0">
        <h1 className="font-semibold text-gray-800">规划公众参与平台 (PPGIS)</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {currentView === AppView.MAP && (
          <div className="h-full w-full">
            <MapView 
                comments={visibleComments} 
                pois={visiblePois}
                onMapClick={handleMapClick} 
                onPOIClick={handlePOIClick}
                center={mapCenter}
                onRegionChange={handleRegionChange}
            />
            {/* Floating Hint */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-md z-[400] text-xs font-medium text-gray-600 pointer-events-none border border-gray-200 whitespace-nowrap">
                点击地图位置评价或反馈问题
            </div>
            {/* Debug/Info Info about visible markers */}
            <div className="absolute bottom-8 right-4 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded z-[400] pointer-events-none">
                区域内加载: {visibleComments.length} 评价, {visiblePois.length} 景点
            </div>
          </div>
        )}
        
        {currentView === AppView.LIST && (
            <div className="h-full w-full overflow-y-auto">
                <ListView comments={comments} />
            </div>
        )}

        {currentView === AppView.STATS && (
            <div className="h-full w-full overflow-y-auto">
                <StatsView comments={comments} />
            </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="h-[80px] bg-white border-t border-gray-200 flex items-start justify-between px-6 pb-6 shrink-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <NavButton view={AppView.MAP} icon={Map} label="地图" />
        
        {/* Center Action Button */}
        <div className="relative -top-5">
           <button 
             onClick={() => {
                if(currentView !== AppView.MAP) setCurrentView(AppView.MAP);
             }}
             className="w-14 h-14 rounded-full bg-[#07C160] text-white flex items-center justify-center shadow-lg shadow-green-200 hover:scale-105 transition-transform"
            >
             <Plus size={28} />
           </button>
        </div>

        <NavButton view={AppView.LIST} icon={List} label="动态" />
        <NavButton view={AppView.STATS} icon={BarChart2} label="分析" />
      </div>

      {/* Modals */}
      <InputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddComment}
        coordinates={tempCoords}
        initialTargetName={activePOIName}
      />
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { RatingValues, Coordinates, PointType } from '../types';
import { X, Loader2, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, ratings: RatingValues, type: PointType, tags?: string[]) => Promise<void>;
  coordinates: Coordinates | null;
  initialTargetName?: string; // If rating an existing POI
}

const RATING_DIMENSIONS = [
  { key: 'recreational', label: '休闲娱乐价值', desc: '游憩、玩耍、放松的适宜程度' },
  { key: 'environmental', label: '资源环境价值', desc: '生态、绿化、自然景观质量' },
  { key: 'historical', label: '历史文化价值', desc: '文物、古迹、地方文化特色' },
  { key: 'economic', label: '经济价值', desc: '商业活力、消费潜力、带动增收' },
  { key: 'emotional', label: '情感联系价值', desc: '归属感、认同感、集体记忆' },
];

const ISSUE_TAGS = [
    "拥挤", "卫生差", "设施损坏", "安全隐患", "噪音扰民", "交通不便", "指引不清", "其他"
];

export const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSubmit, coordinates, initialTargetName }) => {
  const [mode, setMode] = useState<'VALUE' | 'ISSUE'>('VALUE');
  const [text, setText] = useState('');
  const [ratings, setRatings] = useState<RatingValues>({
    recreational: 5,
    environmental: 5,
    historical: 5,
    economic: 5,
    emotional: 5
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setText('');
      setMode('VALUE');
      setSelectedTags([]);
      setRatings({
        recreational: 5,
        environmental: 5,
        historical: 5,
        economic: 5,
        emotional: 5
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSliderChange = (key: keyof RatingValues, value: string) => {
    setRatings(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
  };

  const calculateAverage = () => {
    const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
    return (sum / 5).toFixed(1);
  };

  const handleSubmit = async () => {
    // Validation logic
    if (mode === 'VALUE' && !text.trim()) {
        return;
    }
    if (mode === 'ISSUE' && !text.trim() && selectedTags.length === 0) {
        return;
    }
    
    setIsSubmitting(true);
    const pointType = mode === 'ISSUE' ? PointType.ISSUE_REPORT : (initialTargetName ? PointType.OFFICIAL_POI : PointType.USER_ADDED);
    
    await onSubmit(text, ratings, pointType, mode === 'ISSUE' ? selectedTags : undefined);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-[450px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {initialTargetName ? `地点: ${initialTargetName}` : '新采集点'}
            </h2>
            <p className="text-xs text-gray-500">请选择反馈类型</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
            <button 
                onClick={() => setMode('VALUE')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'VALUE' ? 'bg-white shadow text-[#07C160]' : 'text-gray-500'}`}
            >
                <Star size={16} /> 价值评估
            </button>
            <button 
                onClick={() => setMode('ISSUE')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'ISSUE' ? 'bg-white shadow text-red-500' : 'text-gray-500'}`}
            >
                <AlertTriangle size={16} /> 问题反馈
            </button>
        </div>

        <div className="space-y-5">
          
          {mode === 'VALUE' ? (
            /* Value Assessment Form */
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {RATING_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="space-y-1">
                    <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">{dim.label}</label>
                    <span className="text-sm font-mono text-[#07C160] font-bold">{ratings[dim.key as keyof RatingValues]}分</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1">{dim.desc}</p>
                    <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={ratings[dim.key as keyof RatingValues]}
                    onChange={(e) => handleSliderChange(dim.key as keyof RatingValues, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#07C160]"
                    />
                </div>
                ))}
                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600">综合评分</span>
                    <div className="flex items-center gap-1 text-xl font-bold text-[#07C160]">
                        <Star className="fill-current" size={20} />
                        {calculateAverage()}
                    </div>
                </div>
            </div>
          ) : (
            /* Issue Report Form */
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">存在的问题 (可多选)</label>
                    <div className="flex flex-wrap gap-2">
                        {ISSUE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                    selectedTags.includes(tag) 
                                    ? 'bg-red-50 border-red-200 text-red-600 ring-1 ring-red-200' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {mode === 'VALUE' ? '评价与建议' : '问题描述详情'}
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-offset-1 outline-none resize-none bg-white transition-all"
              style={{ 
                  borderColor: mode === 'VALUE' ? '' : '#FECaca',
                  ['--tw-ring-color' as any]: mode === 'VALUE' ? '#07C160' : '#EF4444'
               }}
              rows={3}
              placeholder={mode === 'VALUE' ? "您对这里有什么看法？" : "请描述具体问题位置和情况..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {coordinates && (
            <div className="text-[10px] text-gray-400 text-center">
              坐标: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (mode === 'VALUE' && !text.trim()) || (mode === 'ISSUE' && !text.trim() && selectedTags.length === 0)}
            className={`w-full py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-white transition-colors ${
                mode === 'VALUE' 
                ? 'bg-[#07C160] hover:bg-[#06ad56] shadow-green-200' 
                : 'bg-red-500 hover:bg-red-600 shadow-red-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 智能分析中...
              </>
            ) : (
               mode === 'VALUE' ? '提交价值评价' : '提交问题反馈'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

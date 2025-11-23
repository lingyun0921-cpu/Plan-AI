import React, { useState } from 'react';
import { CommentData } from '../types';
import { generateCommunityReport } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Sparkles, Loader2, FileText } from 'lucide-react';

interface StatsViewProps {
  comments: CommentData[];
}

export const StatsView: React.FC<StatsViewProps> = ({ comments }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Calculate Average Ratings across all comments
  const calculateAverages = () => {
    if (comments.length === 0) return [];
    
    const sums = {
      recreational: 0,
      environmental: 0,
      historical: 0,
      economic: 0,
      emotional: 0
    };

    comments.forEach(c => {
      sums.recreational += c.ratings.recreational;
      sums.environmental += c.ratings.environmental;
      sums.historical += c.ratings.historical;
      sums.economic += c.ratings.economic;
      sums.emotional += c.ratings.emotional;
    });

    const count = comments.length;
    return [
      { subject: '休闲娱乐', A: (sums.recreational / count).toFixed(1), fullMark: 10 },
      { subject: '资源环境', A: (sums.environmental / count).toFixed(1), fullMark: 10 },
      { subject: '历史文化', A: (sums.historical / count).toFixed(1), fullMark: 10 },
      { subject: '经济价值', A: (sums.economic / count).toFixed(1), fullMark: 10 },
      { subject: '情感联系', A: (sums.emotional / count).toFixed(1), fullMark: 10 },
    ];
  };

  const radarData = calculateAverages();

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const result = await generateCommunityReport(comments);
    setReport(result);
    setLoadingReport(false);
  };

  return (
    <div className="p-4 pb-24 space-y-6 bg-[#F5F5F5] min-h-full">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-[#07C160] rounded-full"></div>
          社区价值特征雷达图
        </h3>
        <div className="h-64 w-full">
          {comments.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar
                  name="平均评分"
                  dataKey="A"
                  stroke="#07C160"
                  fill="#07C160"
                  fillOpacity={0.5}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <div className="w-1 h-5 bg-[#10AEFF] rounded-full"></div>
          参与概况
        </h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
                <span className="block text-2xl font-bold text-blue-600">{comments.length}</span>
                <span className="text-xs text-blue-400">总评价数</span>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
                <span className="block text-2xl font-bold text-purple-600">
                    {comments.length > 0 
                     ? (comments.reduce((acc, c) => acc + c.averageScore, 0) / comments.length).toFixed(1) 
                     : 0}
                </span>
                <span className="text-xs text-purple-400">区域综合均分</span>
            </div>
        </div>
      </div>

      {/* AI Report Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl shadow-sm border border-indigo-100">
        <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" />
                AI 规划师报告
            </h3>
            <button 
                onClick={handleGenerateReport}
                disabled={loadingReport || comments.length === 0}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
                {loadingReport ? '正在分析...' : '生成报告'}
            </button>
        </div>
        
        {loadingReport ? (
            <div className="py-8 flex flex-col items-center text-indigo-400 space-y-2">
                <Loader2 className="animate-spin" />
                <span className="text-xs">正在分析空间价值特征...</span>
            </div>
        ) : report ? (
            <div className="prose prose-sm max-w-none text-gray-700 bg-white/50 p-4 rounded-lg border border-indigo-50">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{report}</p>
            </div>
        ) : (
            <div className="text-sm text-indigo-300 py-4 text-center">
                点击按钮生成基于当前数据的社区规划行政摘要。
            </div>
        )}
      </div>
    </div>
  );
};
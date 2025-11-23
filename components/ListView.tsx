import React from 'react';
import { CommentData, PointType } from '../types';
import { MapPin, Star, AlertTriangle } from 'lucide-react';

interface ListViewProps {
  comments: CommentData[];
}

export const ListView: React.FC<ListViewProps> = ({ comments }) => {
  return (
    <div className="bg-[#F5F5F5] min-h-full pb-20">
      <div className="p-4 sticky top-0 bg-[#F5F5F5] z-10">
        <h2 className="text-xl font-bold text-gray-800">最新动态</h2>
        <p className="text-sm text-gray-500">附近有 {comments.length} 条公众参与记录</p>
      </div>
      
      <div className="px-4 space-y-3">
        {[...comments].reverse().map((comment) => {
          const isIssue = comment.pointType === PointType.ISSUE_REPORT;
          return (
            <div key={comment.id} className={`bg-white p-4 rounded-xl shadow-sm border ${isIssue ? 'border-red-100' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isIssue ? 'bg-red-100' : 'bg-green-100'}`}>
                        {isIssue ? <AlertTriangle size={14} className="text-red-600 fill-current"/> : <Star size={14} className="text-green-600 fill-current"/>}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${isIssue ? 'text-red-700' : 'text-gray-800'}`}>
                            {comment.targetName || (isIssue ? '问题点位' : '自选位置')}
                        </h3>
                        <div className="text-[10px] text-gray-400">{new Date(comment.timestamp).toLocaleDateString()}</div>
                    </div>
                </div>
                {!isIssue ? (
                    <div className="text-lg font-bold text-[#07C160] font-mono">
                        {comment.averageScore}<span className="text-xs text-gray-400 ml-0.5">分</span>
                    </div>
                ) : (
                    <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100">问题反馈</span>
                )}
                </div>

                {isIssue ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {comment.issueTags?.map(tag => (
                             <span key={tag} className="text-[10px] bg-red-50 px-2 py-1 rounded text-red-600 border border-red-100">{tag}</span>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500">休闲 {comment.ratings.recreational}</span>
                        <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500">环境 {comment.ratings.environmental}</span>
                        <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500">文化 {comment.ratings.historical}</span>
                        <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500">经济 {comment.ratings.economic}</span>
                        <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500">情感 {comment.ratings.emotional}</span>
                    </div>
                )}

                <p className="text-gray-800 text-sm mb-3 font-medium bg-gray-50 p-2 rounded-lg">
                    {comment.text}
                </p>
                
                {comment.aiAnalysis && (
                <div className={`mt-2 p-2 rounded text-xs border flex gap-2 items-start ${isIssue ? 'bg-red-50 text-red-800 border-red-100' : 'bg-purple-50 text-purple-800 border-purple-100'}`}>
                    <span className="shrink-0 font-bold">🤖 {isIssue ? '建议' : '分析'}:</span>
                    <span>{comment.aiAnalysis}</span>
                </div>
                )}

                <div className="flex items-center gap-1 mt-3 text-gray-400 text-xs justify-end">
                    <MapPin size={10} />
                    {comment.coords.lat.toFixed(4)}, {comment.coords.lng.toFixed(4)}
                </div>
            </div>
          );
        })}
        {comments.length === 0 && (
            <div className="text-center py-20 text-gray-400 text-sm">
                暂无动态，快去地图上进行第一次评价吧！
            </div>
        )}
      </div>
    </div>
  );
};
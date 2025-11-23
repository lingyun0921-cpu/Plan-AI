import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CommentData, PointType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for individual comment analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    aiAnalysis: {
      type: Type.STRING,
      description: "一句话专业的城市规划评价或整改建议。"
    }
  },
  required: ['aiAnalysis']
};

export const analyzeComment = async (text: string, ratings: any, pointType: PointType, issueTags?: string[]): Promise<Partial<CommentData>> => {
  try {
    let prompt = "";

    if (pointType === PointType.ISSUE_REPORT) {
        prompt = `
          你是一个专业的城市规划AI助手。
          一位市民在PPGIS平台提交了【问题反馈】。
          
          问题描述: "${text}"
          问题标签: ${issueTags?.join(', ') || '无'}
          
          请针对该问题，从城市管理或空间优化的角度，提供一句简短的整改建议或解决方案（中文）。
        `;
    } else {
        prompt = `
          你是一个专业的城市规划AI助手。
          一位市民对某地进行了【价值评估】。
          
          评价内容: "${text}"
          
          评分维度 (0-10分):
          - 休闲娱乐: ${ratings.recreational}
          - 资源环境: ${ratings.environmental}
          - 历史文化: ${ratings.historical}
          - 经济价值: ${ratings.economic}
          - 情感联系: ${ratings.emotional}

          请根据以上评分和文本，提供一句简短专业的规划分析评价，分析该地点的价值特征（中文）。
        `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return {};
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      aiAnalysis: "暂时无法分析。"
    };
  }
};

export const generateCommunityReport = async (comments: CommentData[]): Promise<string> => {
  if (comments.length === 0) return "暂无数据生成报告。";

  try {
    const dataSummary = comments.map(c => {
      if (c.pointType === PointType.ISSUE_REPORT) {
        return `- [问题反馈] ${c.targetName} (标签:${c.issueTags?.join(',')}) 内容:${c.text}`;
      } else {
        return `- [价值评估] ${c.targetName} (均分:${c.averageScore}) 内容:${c.text}`;
      }
    }).join('\n');
    
    const prompt = `
      基于以下PPGIS社区参与式规划平台的反馈数据，为城市规划师生成一份简要的行政摘要（中文）。
      请分析当前区域的：
      1. 主要价值特征（居民喜欢什么？）
      2. 主要存在问题（居民抱怨什么？）
      3. 改进建议
      
      社区反馈列表:
      ${dataSummary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成报告。";
  } catch (error) {
    console.error("Report Generation Failed:", error);
    return "生成报告时出错。";
  }
};
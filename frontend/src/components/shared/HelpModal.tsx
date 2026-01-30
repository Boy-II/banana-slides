import React, { useState } from 'react';
import { Sparkles, FileText, Palette, MessageSquare, Download, ChevronLeft, ChevronRight, Settings, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 功能介紹資料
const features = [
  {
    icon: <Sparkles className="text-yellow-500" size={24} />,
    title: '靈活多樣的創作路徑',
    description: '支援想法、大綱、頁面描述三種起步方式，滿足不同創作習慣。',
    details: [
      '一句話生成：輸入一個主題，AI 自動生成結構清晰的大綱和逐頁內容描述',
      '自然語言編輯：支援以 Vibe 形式口頭修改大綱或描述，AI 即時回應調整',
      '大綱/描述模式：既可一鍵批量生成，也可手動調整細節',
    ],
  },
  {
    icon: <FileText className="text-blue-500" size={24} />,
    title: '強大的素材解析能力',
    description: '上傳多種格式檔案，自動解析內容，為生成提供豐富素材。',
    details: [
      '多格式支援：上傳 PDF/Docx/MD/Txt 等檔案，後台自動解析內容',
      '智慧提取：自動識別文字中的關鍵點、圖片連結和圖表資訊',
      '風格參考：支援上傳參考圖片或範本，客製 PPT 風格',
    ],
  },
  {
    icon: <MessageSquare className="text-green-500" size={24} />,
    title: '「Vibe」式自然語言修改',
    description: '不再受限於複雜的選單按鈕，直接透過自然語言下達修改指令。',
    details: [
      '局部重繪：對不滿意的區域進行口頭式修改（如「把這個圖換成圓餅圖」）',
      '整頁優化：基於 nano banana pro🍌 生成高清、風格統一的頁面',
    ],
  },
  {
    icon: <Download className="text-purple-500" size={24} />,
    title: '開箱即用的格式匯出',
    description: '一鍵匯出標準格式，直接演示無需調整。',
    details: [
      '多格式支援：一鍵匯出標準 PPTX 或 PDF 檔案',
      '完美適配：預設 16:9 比例，排版無需二次調整',
    ],
  },
];

/**
 * 帮助模态框组件
 * 分页展示：引导页 → 案例展示 → 功能介绍
 */
export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0); // 0: 引导页, 1: 功能介绍
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  const totalPages = 2;

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings');
  };

  const renderGuidePage = () => (
    <div className="space-y-6">
      {/* 歡迎標題 */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center mr-4">
          <img
            src="/logo.svg"
            alt="BW Logo"
            className="h-16 w-16 object-contain"
          />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">歡迎使用BW！</h3>
        <p className="text-sm text-gray-600">在開始前，讓我們先完成基礎設定</p>
      </div>

      {/* 設定步驟 */}
      <div className="space-y-4">
        {/* 步驟 1 */}
        <div className="flex gap-4 p-4 bg-gradient-to-r from-banana-50 to-orange-50 rounded-xl border border-banana-200">
          <div className="flex-shrink-0 w-8 h-8 bg-banana-500 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-gray-800">設定 API Key</h4>
            <p className="text-sm text-gray-600">
              前往設定頁面，設定專案需要使用的 API 服務，包括：
            </p>
            <ul className="text-sm text-gray-600 space-y-1 pl-4">
              <li>• 您的 AI 服務提供商的 API Base 和 API Key</li>
              <li>• 設定文字、圖像生成模型 (banana pro) 和圖像描述模型</li>
              <li>• 若需要檔案解析功能，請設定 MinerU Token</li>
              <li>• 若需要可編輯匯出功能，請設定 MinerU TOKEN 和 Baidu API KEY</li>

            </ul>
          </div>
        </div>

        {/* 步驟 2 */}
        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-gray-800">儲存並測試</h4>
            <p className="text-sm text-gray-600">
              設定完成後，務必點擊「儲存設定」按鈕，然後在頁面底部進行服務測試，確保各項服務正常運作。
            </p>
          </div>
        </div>

        {/* 步驟 3 */}
        <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
            <Check size={18} />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-gray-800">開始創作</h4>
            <p className="text-sm text-gray-600">
              設定成功後，返回首頁即可開始使用 AI 生成精美的 PPT！
            </p>
          </div>
        </div>
      </div>

      {/* 前往設定按鈕 */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleGoToSettings}
          className="bg-banana-500 hover:bg-banana-600 text-black shadow-lg"
          icon={<Settings size={18} />}
        >
          前往設定頁面
        </Button>
      </div>

      {/* 提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>提示</strong>：如果您還沒有 API Key，可以前往對應服務商官網註冊取得。設定完成後，建議先進行服務測試，避免後續使用出現問題。
        </p>
      </div>
    </div>
  );

  const renderFeaturesPage = () => (
    <div className="space-y-3">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className={`border rounded-xl transition-all cursor-pointer ${
            expandedFeature === idx
              ? 'border-banana-300 bg-banana-50/50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
          onClick={() => setExpandedFeature(expandedFeature === idx ? null : idx)}
        >
          {/* 标题行 */}
          <div className="flex items-center gap-3 p-4">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-800">{feature.title}</h4>
              <p className="text-sm text-gray-500 truncate">{feature.description}</p>
            </div>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform flex-shrink-0 ${
                expandedFeature === idx ? 'rotate-90' : ''
              }`}
            />
          </div>

          {/* 展开详情 */}
          {expandedFeature === idx && (
            <div className="px-4 pb-4 pt-0">
              <div className="pl-13 space-y-2">
                {feature.details.map((detail, detailIdx) => (
                  <div key={detailIdx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-banana-500 mt-1">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        {/* 標題區 */}
        <div className="text-center pb-4 border-b border-gray-100">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-banana-50 to-orange-50 rounded-full mb-3">
            <Palette size={18} className="text-banana-600" />
            <span className="text-sm font-medium text-gray-700">BW · Banana Slides</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentPage === 0 ? '快速開始' : '功能介紹'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {currentPage === 0 ? '完成基礎設定，開啟 AI 創作之旅' : '探索如何使用 AI 快速建立精美 PPT'}
          </p>
        </div>

        {/* 頁面指示器 */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentPage
                  ? 'bg-banana-500 w-8'
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
              title={idx === 0 ? '引導頁' : '功能介紹'}
            />
          ))}
        </div>

        {/* 内容区 */}
        <div className="min-h-[400px]">
          {currentPage === 0 && renderGuidePage()}
          {currentPage === 1 && renderFeaturesPage()}
        </div>

        {/* 底部導覽 */}
        <div className="pt-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-2">
            {currentPage > 0 && (
              <Button
                variant="ghost"
                onClick={handlePrevPage}
                icon={<ChevronLeft size={16} />}
                size="sm"
              >
                上一頁
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentPage < totalPages - 1 ? (
              <Button
                onClick={handleNextPage}
                icon={<ChevronRight size={16} />}
                size="sm"
                className="bg-banana-500 hover:bg-banana-600 text-black"
              >
                下一頁
              </Button>
            ) : (
              <Button variant="ghost" onClick={onClose} size="sm">
                關閉
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

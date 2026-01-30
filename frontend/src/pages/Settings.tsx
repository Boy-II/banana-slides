import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Key, Image, Zap, Save, RotateCcw, Globe, FileText, Brain } from 'lucide-react';
import { Button, Input, Card, Loading, useToast, useConfirm } from '@/components/shared';
import * as api from '@/api/endpoints';
import type { OutputLanguage } from '@/api/endpoints';
import { OUTPUT_LANGUAGE_OPTIONS } from '@/api/endpoints';
import type { Settings as SettingsType } from '@/types';

// 設定項類型定義
type FieldType = 'text' | 'password' | 'number' | 'select' | 'buttons' | 'switch';

interface FieldConfig {
  key: keyof typeof initialFormData;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  sensitiveField?: boolean;  // 是否為敏感欄位（如 API Key）
  lengthKey?: keyof SettingsType;  // 用於顯示已有長度的 key（如 api_key_length）
  options?: { value: string; label: string }[];  // select 類型的選項
  min?: number;
  max?: number;
}

interface SectionConfig {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface ServiceTestState {
  status: TestStatus;
  message?: string;
  detail?: string;
}

// 初始表單資料
const initialFormData = {
  ai_provider_format: 'gemini' as 'openai' | 'gemini',
  api_base_url: '',
  api_key: '',
  text_model: '',
  image_model: '',
  image_caption_model: '',
  mineru_api_base: '',
  mineru_token: '',
  image_resolution: '2K',
  image_aspect_ratio: '16:9',
  max_description_workers: 5,
  max_image_workers: 8,
  output_language: 'zh' as OutputLanguage,
  // 推理模式設定（分別控制文字和圖像）
  enable_text_reasoning: false,
  text_thinking_budget: 1024,
  enable_image_reasoning: false,
  image_thinking_budget: 1024,
  baidu_ocr_api_key: '',
};

// 設定驅動的表單區塊定義
const settingsSections: SectionConfig[] = [
  {
    title: '大型模型 API 設定',
    icon: <Key size={20} />,
    fields: [
      {
        key: 'ai_provider_format',
        label: 'AI 提供商格式',
        type: 'buttons',
        description: '選擇 API 請求格式，影響後端如何建構和發送請求。儲存設定後生效。',
        options: [
          { value: 'openai', label: 'OpenAI 格式' },
          { value: 'gemini', label: 'Gemini 格式' },
        ],
      },
      {
        key: 'api_base_url',
        label: 'API Base URL',
        type: 'text',
        placeholder: 'https://api.example.com',
        description: '設定大型模型提供商 API 的基礎 URL',
      },
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: '輸入新的 API Key',
        sensitiveField: true,
        lengthKey: 'api_key_length',
        description: '留空則保持目前設定不變，輸入新值則更新',
      },
    ],
  },
  {
    title: '模型設定',
    icon: <FileText size={20} />,
    fields: [
      {
        key: 'text_model',
        label: '文字大型模型',
        type: 'text',
        placeholder: '留空使用環境變數設定 (如: gemini-3-flash-preview)',
        description: '用於生成大綱、描述等文字內容的模型名稱',
      },
      {
        key: 'image_model',
        label: '圖像生成模型',
        type: 'text',
        placeholder: '留空使用環境變數設定 (如: imagen-3.0-generate-001)',
        description: '用於生成頁面圖片的模型名稱',
      },
      {
        key: 'image_caption_model',
        label: '圖片識別模型',
        type: 'text',
        placeholder: '留空使用環境變數設定 (如: gemini-3-flash-preview)',
        description: '用於識別參考檔案中的圖片並生成描述',
      },
    ],
  },
  {
    title: 'MinerU 設定',
    icon: <FileText size={20} />,
    fields: [
      {
        key: 'mineru_api_base',
        label: 'MinerU API Base',
        type: 'text',
        placeholder: '留空使用環境變數設定 (如: https://mineru.net)',
        description: 'MinerU 服務位址，用於解析參考檔案',
      },
      {
        key: 'mineru_token',
        label: 'MinerU Token',
        type: 'password',
        placeholder: '輸入新的 MinerU Token',
        sensitiveField: true,
        lengthKey: 'mineru_token_length',
        description: '留空則保持目前設定不變，輸入新值則更新',
      },
    ],
  },
  {
    title: '圖像生成設定',
    icon: <Image size={20} />,
    fields: [
      {
        key: 'image_resolution',
        label: '圖像清晰度（某些 OpenAI 格式中轉調整該值無效）',
        type: 'select',
        description: '更高的清晰度會生成更詳細的圖像，但需要更長時間',
        options: [
          { value: '1K', label: '1K (1024px)' },
          { value: '2K', label: '2K (2048px)' },
          { value: '4K', label: '4K (4096px)' },
        ],
      },
    ],
  },
  {
    title: '效能設定',
    icon: <Zap size={20} />,
    fields: [
      {
        key: 'max_description_workers',
        label: '描述生成最大並行數',
        type: 'number',
        min: 1,
        max: 20,
        description: '同時生成描述的最大工作執行緒數 (1-20)，越大速度越快',
      },
      {
        key: 'max_image_workers',
        label: '圖像生成最大並行數',
        type: 'number',
        min: 1,
        max: 20,
        description: '同時生成圖像的最大工作執行緒數 (1-20)，越大速度越快',
      },
    ],
  },
  {
    title: '輸出語言設定',
    icon: <Globe size={20} />,
    fields: [
      {
        key: 'output_language',
        label: '預設輸出語言',
        type: 'buttons',
        description: 'AI 生成內容時使用的預設語言',
        options: OUTPUT_LANGUAGE_OPTIONS,
      },
    ],
  },
  {
    title: '文字推理模式',
    icon: <Brain size={20} />,
    fields: [
      {
        key: 'enable_text_reasoning',
        label: '啟用文字推理',
        type: 'switch',
        description: '開啟後，文字生成（大綱、描述等）會使用 extended thinking 進行深度推理',
      },
      {
        key: 'text_thinking_budget',
        label: '文字思考負載',
        type: 'number',
        min: 1,
        max: 8192,
        description: '文字推理的思考 token 預算 (1-8192)，數值越大推理越深入',
      },
    ],
  },
  {
    title: '圖像推理模式',
    icon: <Brain size={20} />,
    fields: [
      {
        key: 'enable_image_reasoning',
        label: '啟用圖像推理',
        type: 'switch',
        description: '開啟後，圖像生成會使用思考鏈模式，可能獲得更好的構圖效果',
      },
      {
        key: 'image_thinking_budget',
        label: '圖像思考負載',
        type: 'number',
        min: 1,
        max: 8192,
        description: '圖像推理的思考 token 預算 (1-8192)，數值越大推理越深入',
      },
    ],
  },
  {
    title: 'OCR 設定（實驗中）',
    icon: <FileText size={20} />,
    fields: [
      {
        key: 'baidu_ocr_api_key',
        label: 'OCR API Key',
        type: 'password',
        placeholder: '輸入 OCR API Key',
        sensitiveField: true,
        lengthKey: 'baidu_ocr_api_key_length',
        description: '用於可編輯 PPTX 匯出時的文字識別功能，留空則保持目前設定不變',
      },
    ],
  },
];

// Settings 元件 - 純嵌入模式（可複用）
export const Settings: React.FC = () => {
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [serviceTestStates, setServiceTestStates] = useState<Record<string, ServiceTestState>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSettings();
      if (response.data) {
        setSettings(response.data);
        setFormData({
          ai_provider_format: response.data.ai_provider_format || 'gemini',
          api_base_url: response.data.api_base_url || '',
          api_key: '',
          image_resolution: response.data.image_resolution || '2K',
          image_aspect_ratio: response.data.image_aspect_ratio || '16:9',
          max_description_workers: response.data.max_description_workers || 5,
          max_image_workers: response.data.max_image_workers || 8,
          text_model: response.data.text_model || '',
          image_model: response.data.image_model || '',
          mineru_api_base: response.data.mineru_api_base || '',
          mineru_token: '',
          image_caption_model: response.data.image_caption_model || '',
          output_language: response.data.output_language || 'zh',
          enable_text_reasoning: response.data.enable_text_reasoning || false,
          text_thinking_budget: response.data.text_thinking_budget || 1024,
          enable_image_reasoning: response.data.enable_image_reasoning || false,
          image_thinking_budget: response.data.image_thinking_budget || 1024,
          baidu_ocr_api_key: '',
        });
      }
    } catch (error: any) {
      console.error('載入設定失敗:', error);
      show({
        message: '載入設定失敗: ' + (error?.message || '未知錯誤'),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { api_key, mineru_token, baidu_ocr_api_key, ...otherData } = formData;
      const payload: Parameters<typeof api.updateSettings>[0] = {
        ...otherData,
      };

      if (api_key) {
        payload.api_key = api_key;
      }

      if (mineru_token) {
        payload.mineru_token = mineru_token;
      }

      if (baidu_ocr_api_key) {
        payload.baidu_ocr_api_key = baidu_ocr_api_key;
      }

      const response = await api.updateSettings(payload);
      if (response.data) {
        setSettings(response.data);
        show({ message: '設定儲存成功', type: 'success' });
        show({ message: '建議在本頁底部進行服務測試，驗證關鍵設定', type: 'info' });
        setFormData(prev => ({ ...prev, api_key: '', mineru_token: '', baidu_ocr_api_key: '' }));
      }
    } catch (error: any) {
      console.error('儲存設定失敗:', error);
      show({
        message: '儲存設定失敗: ' + (error?.response?.data?.error?.message || error?.message || '未知錯誤'),
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    confirm(
      '將把大型模型、圖像生成和並行等所有設定恢復為環境預設值，已儲存的自訂設定將遺失，確定繼續嗎？',
      async () => {
        setIsSaving(true);
        try {
          const response = await api.resetSettings();
          if (response.data) {
            setSettings(response.data);
            setFormData({
              ai_provider_format: response.data.ai_provider_format || 'gemini',
              api_base_url: response.data.api_base_url || '',
              api_key: '',
              image_resolution: response.data.image_resolution || '2K',
              image_aspect_ratio: response.data.image_aspect_ratio || '16:9',
              max_description_workers: response.data.max_description_workers || 5,
              max_image_workers: response.data.max_image_workers || 8,
              text_model: response.data.text_model || '',
              image_model: response.data.image_model || '',
              mineru_api_base: response.data.mineru_api_base || '',
              mineru_token: '',
              image_caption_model: response.data.image_caption_model || '',
              output_language: response.data.output_language || 'zh',
              enable_text_reasoning: response.data.enable_text_reasoning || false,
              text_thinking_budget: response.data.text_thinking_budget || 1024,
              enable_image_reasoning: response.data.enable_image_reasoning || false,
              image_thinking_budget: response.data.image_thinking_budget || 1024,
              baidu_ocr_api_key: '',
            });
            show({ message: '設定已重設', type: 'success' });
          }
        } catch (error: any) {
          console.error('重設設定失敗:', error);
          show({
            message: '重設設定失敗: ' + (error?.message || '未知錯誤'),
            type: 'error'
          });
        } finally {
          setIsSaving(false);
        }
      },
      {
        title: '確認重設為預設設定',
        confirmText: '確定重設',
        cancelText: '取消',
        variant: 'warning',
      }
    );
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateServiceTest = (key: string, nextState: ServiceTestState) => {
    setServiceTestStates(prev => ({ ...prev, [key]: nextState }));
  };

  const handleServiceTest = async (
    key: string,
    action: (settings?: any) => Promise<any>,
    formatDetail: (data: any) => string
  ) => {
    updateServiceTest(key, { status: 'loading' });
    try {
      // 準備測試時要使用的設定（包括未儲存的修改）
      const testSettings: any = {};

      // 只傳遞使用者已填寫的非空值
      if (formData.api_key) testSettings.api_key = formData.api_key;
      if (formData.api_base_url) testSettings.api_base_url = formData.api_base_url;
      if (formData.ai_provider_format) testSettings.ai_provider_format = formData.ai_provider_format;
      if (formData.text_model) testSettings.text_model = formData.text_model;
      if (formData.image_model) testSettings.image_model = formData.image_model;
      if (formData.image_caption_model) testSettings.image_caption_model = formData.image_caption_model;
      if (formData.mineru_api_base) testSettings.mineru_api_base = formData.mineru_api_base;
      if (formData.mineru_token) testSettings.mineru_token = formData.mineru_token;
      if (formData.baidu_ocr_api_key) testSettings.baidu_ocr_api_key = formData.baidu_ocr_api_key;
      if (formData.image_resolution) testSettings.image_resolution = formData.image_resolution;

      // 推理模式設定
      if (formData.enable_text_reasoning !== undefined) {
        testSettings.enable_text_reasoning = formData.enable_text_reasoning;
      }
      if (formData.text_thinking_budget !== undefined) {
        testSettings.text_thinking_budget = formData.text_thinking_budget;
      }
      if (formData.enable_image_reasoning !== undefined) {
        testSettings.enable_image_reasoning = formData.enable_image_reasoning;
      }
      if (formData.image_thinking_budget !== undefined) {
        testSettings.image_thinking_budget = formData.image_thinking_budget;
      }

      // 啟動非同步測試，取得任務ID
      const response = await action(testSettings);
      const taskId = response.data.task_id;

      // 開始輪詢任務狀態
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await api.getTestStatus(taskId);
          const taskStatus = statusResponse.data.status;

          if (taskStatus === 'COMPLETED') {
            clearInterval(pollInterval);
            const detail = formatDetail(statusResponse.data.result || {});
            const message = statusResponse.data.message || '測試成功';
            updateServiceTest(key, { status: 'success', message, detail });
            show({ message, type: 'success' });
          } else if (taskStatus === 'FAILED') {
            clearInterval(pollInterval);
            const errorMessage = statusResponse.data.error || '測試失敗';
            updateServiceTest(key, { status: 'error', message: errorMessage });
            show({ message: '測試失敗: ' + errorMessage, type: 'error' });
          }
          // 如果是 PENDING 或 PROCESSING，繼續輪詢
        } catch (pollError: any) {
          clearInterval(pollInterval);
          const errorMessage = pollError?.response?.data?.error?.message || pollError?.message || '輪詢失敗';
          updateServiceTest(key, { status: 'error', message: errorMessage });
          show({ message: '測試失敗: ' + errorMessage, type: 'error' });
        }
      }, 2000); // 每2秒輪詢一次

      // 設定最大輪詢時間（2分鐘）
      setTimeout(() => {
        clearInterval(pollInterval);
        if (serviceTestStates[key]?.status === 'loading') {
          updateServiceTest(key, { status: 'error', message: '測試逾時' });
          show({ message: '測試逾時，請重試', type: 'error' });
        }
      }, 120000);

    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || '未知錯誤';
      updateServiceTest(key, { status: 'error', message: errorMessage });
      show({ message: '測試失敗: ' + errorMessage, type: 'error' });
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key];

    if (field.type === 'buttons' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFieldChange(field.key, option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === option.value
                  ? option.value === 'openai'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {field.description && (
            <p className="mt-1 text-xs text-gray-500">{field.description}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full h-10 px-4 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="mt-1 text-sm text-gray-500">{field.description}</p>
          )}
        </div>
      );
    }

    // switch 類型 - 開關切換
    if (field.type === 'switch') {
      const isEnabled = Boolean(value);
      return (
        <div key={field.key}>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <button
              type="button"
              onClick={() => handleFieldChange(field.key, !isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-banana-500 focus:ring-offset-2 ${isEnabled ? 'bg-banana-500' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
          {field.description && (
            <p className="mt-1 text-sm text-gray-500">{field.description}</p>
          )}
        </div>
      );
    }

    // text, password, number 類型
    const placeholder = field.sensitiveField && settings && field.lengthKey
      ? `已設定（長度: ${settings[field.lengthKey]}）`
      : field.placeholder || '';

    // 判斷是否停用（思考負載欄位在對應開關關閉時停用）
    let isDisabled = false;
    if (field.key === 'text_thinking_budget') {
      isDisabled = !formData.enable_text_reasoning;
    } else if (field.key === 'image_thinking_budget') {
      isDisabled = !formData.enable_image_reasoning;
    }

    return (
      <div key={field.key} className={isDisabled ? 'opacity-50' : ''}>
        <Input
          label={field.label}
          type={field.type === 'number' ? 'number' : field.type}
          placeholder={placeholder}
          value={value as string | number}
          onChange={(e) => {
            const newValue = field.type === 'number'
              ? parseInt(e.target.value) || (field.min ?? 0)
              : e.target.value;
            handleFieldChange(field.key, newValue);
          }}
          min={field.min}
          max={field.max}
          disabled={isDisabled}
        />
        {field.description && (
          <p className="mt-1 text-sm text-gray-500">{field.description}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading message="載入設定中..." />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      {ConfirmDialog}
      <div className="space-y-8">
        {/* 設定區塊（設定驅動） */}
        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                {section.icon}
                <span className="ml-2">{section.title}</span>
              </h2>
              <div className="space-y-4">
                {section.fields.map((field) => renderField(field))}
              </div>
            </div>
          ))}
        </div>

        {/* 服務測試區 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <FileText size={20} />
            <span className="ml-2">服務測試</span>
          </h2>
          <p className="text-sm text-gray-500">
            提前驗證關鍵服務設定是否可用，避免使用期間異常。
          </p>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 提示：圖像生成和 MinerU 測試可能需要 30-60 秒，請耐心等待。
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                key: 'baidu-ocr',
                title: 'OCR 服務（實驗中）',
                description: '識別測試圖片文字，驗證 OCR_API_KEY 設定',
                action: api.testBaiduOcr,
                formatDetail: (data: any) => (data?.recognized_text ? `識別結果：${data.recognized_text}` : ''),
              },
              {
                key: 'text-model',
                title: '文字生成模型',
                description: '發送短提示詞，驗證文字模型與 API 設定',
                action: api.testTextModel,
                formatDetail: (data: any) => (data?.reply ? `模型回覆：${data.reply}` : ''),
              },
              {
                key: 'caption-model',
                title: '圖片識別模型',
                description: '生成測試圖片並請求模型輸出描述',
                action: api.testCaptionModel,
                formatDetail: (data: any) => (data?.caption ? `識別描述：${data.caption}` : ''),
              },
              {
                key: 'baidu-inpaint',
                title: '圖像修復（實驗中）',
                description: '使用測試圖片執行修復，驗證 inpaint 服務',
                action: api.testBaiduInpaint,
                formatDetail: (data: any) => (data?.image_size ? `輸出尺寸：${data.image_size[0]}x${data.image_size[1]}` : ''),
              },
              {
                key: 'image-model',
                title: '圖像生成模型',
                description: '基於測試圖片生成簡報背景圖（1K，可能需要 20-40 秒）',
                action: api.testImageModel,
                formatDetail: (data: any) => (data?.image_size ? `輸出尺寸：${data.image_size[0]}x${data.image_size[1]}` : ''),
              },
              {
                key: 'mineru-pdf',
                title: 'MinerU 解析 PDF',
                description: '上傳測試 PDF 並等待解析結果回傳（可能需要 30-60 秒）',
                action: api.testMineruPdf,
                formatDetail: (data: any) => (data?.content_preview ? `解析預覽：${data.content_preview}` : data?.message || ''),
              },
            ].map((item) => {
              const testState = serviceTestStates[item.key] || { status: 'idle' as TestStatus };
              const isLoadingTest = testState.status === 'loading';
              return (
                <div
                  key={item.key}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-base font-semibold text-gray-800">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={isLoadingTest}
                      onClick={() => handleServiceTest(item.key, item.action, item.formatDetail)}
                    >
                      {isLoadingTest ? '測試中...' : '開始測試'}
                    </Button>
                  </div>
                  {testState.status === 'success' && (
                    <p className="text-sm text-green-600">
                      {testState.message}{testState.detail ? `｜${testState.detail}` : ''}
                    </p>
                  )}
                  {testState.status === 'error' && (
                    <p className="text-sm text-red-600">
                      {testState.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={handleReset}
            disabled={isSaving}
          >
            重設為預設設定
          </Button>
          <Button
            variant="primary"
            icon={<Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
          >
            {isSaving ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </div>
    </>
  );
};

// SettingsPage 元件 - 完整頁面包裝
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#e2dccf]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 md:p-8">
          <div className="space-y-8">
            {/* 頂部標題 */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <Button
                  variant="secondary"
                  icon={<Home size={18} />}
                  onClick={() => navigate('/')}
                  className="mr-4"
                >
                  返回首頁
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">系統設定</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    設定應用程式的各項參數
                  </p>
                </div>
              </div>
            </div>

            <Settings />
          </div>
        </Card>
      </div>
    </div>
  );
};

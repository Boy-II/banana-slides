import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Clock, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { Button, Loading, Card } from '@/components/shared';
import { useProjectStore } from '@/store/useProjectStore';
import * as api from '@/api/endpoints';
import { getImageUrl } from '@/api/client';
import { normalizeProject } from '@/utils';
import type { Project } from '@/types';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { syncProject, setCurrentProject } = useProjectStore();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listProjects(50, 0);
      if (response.data?.projects) {
        const normalizedProjects = response.data.projects.map(normalizeProject);
        setProjects(normalizedProjects);
      }
    } catch (err: any) {
      console.error('加载历史项目失败:', err);
      setError(err.message || '加载历史项目失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    const projectId = project.id || project.project_id;
    if (!projectId) return;

    try {
      // 设置当前项目
      setCurrentProject(project);
      localStorage.setItem('currentProjectId', projectId);
      
      // 同步项目数据
      await syncProject(projectId);
      
      // 根据项目状态跳转到不同页面
      if (project.pages && project.pages.length > 0) {
        // 检查是否有生成的图片
        const hasImages = project.pages.some(p => p.generated_image_path);
        if (hasImages) {
          navigate(`/project/${projectId}/preview`);
        } else {
          // 检查是否有描述
          const hasDescriptions = project.pages.some(p => p.description_content);
          if (hasDescriptions) {
            navigate(`/project/${projectId}/detail`);
          } else {
            navigate(`/project/${projectId}/outline`);
          }
        }
      } else {
        // 没有页面，跳转到大纲编辑
        navigate(`/project/${projectId}/outline`);
      }
    } catch (err: any) {
      console.error('打开项目失败:', err);
      alert('打开项目失败: ' + (err.message || '未知错误'));
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发项目选择
    
    const projectId = project.id || project.project_id;
    if (!projectId) return;

    const projectTitle = project.idea_prompt || '未命名项目';
    if (!confirm(`确定要删除项目"${projectTitle}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      
      // 如果删除的是当前项目，清除状态
      const currentProjectId = localStorage.getItem('currentProjectId');
      if (currentProjectId === projectId) {
        localStorage.removeItem('currentProjectId');
        setCurrentProject(null);
      }
      
      // 从列表中移除
      setProjects(projects.filter(p => (p.id || p.project_id) !== projectId));
    } catch (err: any) {
      console.error('删除项目失败:', err);
      alert('删除项目失败: ' + (err.message || '未知错误'));
    }
  };

  const getFirstPageImage = (project: Project): string | null => {
    if (!project.pages || project.pages.length === 0) {
      return null;
    }
    
    // 找到第一页有图片的页面
    const firstPageWithImage = project.pages.find(p => p.generated_image_path);
    if (firstPageWithImage?.generated_image_path) {
      return getImageUrl(firstPageWithImage.generated_image_path);
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (project: Project) => {
    if (!project.pages || project.pages.length === 0) {
      return '未开始';
    }
    const hasImages = project.pages.some(p => p.generated_image_path);
    if (hasImages) {
      return '已完成';
    }
    const hasDescriptions = project.pages.some(p => p.description_content);
    if (hasDescriptions) {
      return '待生成图片';
    }
    return '待生成描述';
  };

  const getStatusColor = (project: Project) => {
    const status = getStatusText(project);
    if (status === '已完成') return 'text-green-600 bg-green-50';
    if (status === '待生成图片') return 'text-yellow-600 bg-yellow-50';
    if (status === '待生成描述') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-banana-50 via-white to-gray-50">
      {/* 导航栏 */}
      <nav className="h-16 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-banana-500 to-banana-600 rounded-lg flex items-center justify-center text-2xl">
              🍌
            </div>
            <span className="text-xl font-bold text-gray-900">蕉幻</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<Home size={18} />}
              onClick={() => navigate('/')}
            >
              主页
            </Button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">历史项目</h1>
          <p className="text-gray-600">查看和管理你的所有项目</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading message="加载中..." />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={loadProjects}>
              重试
            </Button>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              暂无历史项目
            </h3>
            <p className="text-gray-500 mb-6">
              创建你的第一个项目开始使用吧
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              创建新项目
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const projectId = project.id || project.project_id;
              const title = project.idea_prompt || '未命名项目';
              const pageCount = project.pages?.length || 0;
              const statusText = getStatusText(project);
              const statusColor = getStatusColor(project);
              const firstPageImage = getFirstPageImage(project);
              
              return (
                <Card
                  key={projectId}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="flex items-start gap-4">
                    {/* 左侧：项目信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          {pageCount} 页
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(project.updated_at || project.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 右侧：图片预览和操作 */}
                    <div className="flex items-center gap-3">
                      {/* 图片预览 */}
                      <div className="w-64 h-36 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                        {firstPageImage ? (
                          <img
                            src={firstPageImage}
                            alt="第一页预览"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText size={24} />
                          </div>
                        )}
                      </div>
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handleDeleteProject(e, project)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="删除项目"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      {/* 右箭头 */}
                      <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};


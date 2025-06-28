/**
 * 简历编辑弹窗组件
 * 提供完整的简历信息编辑功能
 */

import React from 'react';

const EditModal = ({ 
  isOpen, 
  onClose, 
  editedResult, 
  onEditChange, 
  onAddExperience, 
  onRemoveExperience, 
  onSave, 
  isSaving 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 弹窗头部 */}
        <div className="bg-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">✏️ 编辑简历信息</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 编辑个人信息 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-3">📝 编辑个人信息</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={editedResult?.personalInfo?.name || ''}
                    onChange={(e) => onEditChange('personalInfo', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={editedResult?.personalInfo?.email || ''}
                    onChange={(e) => onEditChange('personalInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="tel"
                    value={editedResult?.personalInfo?.phone || ''}
                    onChange={(e) => onEditChange('personalInfo', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入电话号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <input
                    type="text"
                    value={editedResult?.personalInfo?.location || ''}
                    onChange={(e) => onEditChange('personalInfo', 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入居住地址"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={editedResult?.personalInfo?.summary || ''}
                  onChange={(e) => onEditChange('personalInfo', 'summary', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="请输入个人简介"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">求职意向</label>
                <input
                  type="text"
                  value={editedResult?.personalInfo?.objective || ''}
                  onChange={(e) => onEditChange('personalInfo', 'objective', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="请输入求职意向"
                />
              </div>
            </div>

            {/* 编辑教育经历 */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-green-900">🎓 编辑教育经历</h5>
                <button
                  onClick={() => onAddExperience('educations')}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  ➕ 添加教育经历
                </button>
              </div>
              {editedResult?.educations?.map((edu, index) => (
                <div key={index} className="bg-white p-3 rounded mb-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">教育经历 {index + 1}</span>
                    <button
                      onClick={() => onRemoveExperience('educations', index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">学校</label>
                      <input
                        type="text"
                        value={edu.school || ''}
                        onChange={(e) => onEditChange('educations', 'school', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="学校名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">专业</label>
                      <input
                        type="text"
                        value={edu.major || ''}
                        onChange={(e) => onEditChange('educations', 'major', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="专业名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">学位</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => onEditChange('educations', 'degree', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="学位"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">GPA</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => onEditChange('educations', 'gpa', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="GPA"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">开始时间</label>
                      <input
                        type="text"
                        value={edu.startDate || ''}
                        onChange={(e) => onEditChange('educations', 'startDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="2020-09"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">结束时间</label>
                      <input
                        type="text"
                        value={edu.endDate || ''}
                        onChange={(e) => onEditChange('educations', 'endDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="2024-06"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑工作经历 */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-purple-900">💼 编辑工作经历</h5>
                <button
                  onClick={() => onAddExperience('workExperiences')}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                >
                  ➕ 添加工作经历
                </button>
              </div>
              {editedResult?.workExperiences?.map((work, index) => (
                <div key={index} className="bg-white p-3 rounded mb-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">工作经历 {index + 1}</span>
                    <button
                      onClick={() => onRemoveExperience('workExperiences', index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">公司</label>
                      <input
                        type="text"
                        value={work.company || ''}
                        onChange={(e) => onEditChange('workExperiences', 'company', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="公司名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">职位</label>
                      <input
                        type="text"
                        value={work.position || ''}
                        onChange={(e) => onEditChange('workExperiences', 'position', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="职位名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">开始时间</label>
                      <input
                        type="text"
                        value={work.startDate || ''}
                        onChange={(e) => onEditChange('workExperiences', 'startDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="2022-01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">结束时间</label>
                      <input
                        type="text"
                        value={work.endDate || ''}
                        onChange={(e) => onEditChange('workExperiences', 'endDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="至今"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">工作描述</label>
                    <textarea
                      value={work.description || ''}
                      onChange={(e) => onEditChange('workExperiences', 'description', e.target.value, index)}
                      rows="2"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="描述主要工作内容和成就"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑项目经历 */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-orange-900">🚀 编辑项目经历</h5>
                <button
                  onClick={() => onAddExperience('projects')}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                >
                  ➕ 添加项目经历
                </button>
              </div>
              {editedResult?.projects?.map((project, index) => (
                <div key={index} className="bg-white p-3 rounded mb-3 border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">项目经历 {index + 1}</span>
                    <button
                      onClick={() => onRemoveExperience('projects', index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️ 删除
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">项目名称</label>
                      <input
                        type="text"
                        value={project.name || ''}
                        onChange={(e) => onEditChange('projects', 'name', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="项目名称"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">担任角色</label>
                      <input
                        type="text"
                        value={project.role || ''}
                        onChange={(e) => onEditChange('projects', 'role', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="项目角色"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">开始时间</label>
                      <input
                        type="text"
                        value={project.startDate || ''}
                        onChange={(e) => onEditChange('projects', 'startDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="2023-01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">结束时间</label>
                      <input
                        type="text"
                        value={project.endDate || ''}
                        onChange={(e) => onEditChange('projects', 'endDate', e.target.value, index)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="2023-06"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">项目描述</label>
                    <textarea
                      value={project.description || ''}
                      onChange={(e) => onEditChange('projects', 'description', e.target.value, index)}
                      rows="2"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="描述项目内容和成果"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 编辑技能 */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h5 className="font-medium text-indigo-900 mb-3">💪 编辑技能</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">技术技能</label>
                  <input
                    type="text"
                    value={editedResult?.skills?.technical?.join(', ') || ''}
                    onChange={(e) => onEditChange('skills', 'technical', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="用逗号分隔，如：JavaScript, Python, React"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">专业技能</label>
                  <input
                    type="text"
                    value={editedResult?.skills?.professional?.join(', ') || ''}
                    onChange={(e) => onEditChange('skills', 'professional', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="用逗号分隔，如：项目管理, 数据分析, 产品设计"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">软技能</label>
                  <input
                    type="text"
                    value={editedResult?.skills?.soft?.join(', ') || ''}
                    onChange={(e) => onEditChange('skills', 'soft', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="用逗号分隔，如：团队协作, 沟通能力, 领导力"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">认证证书</label>
                  <input
                    type="text"
                    value={editedResult?.skills?.certifications?.join(', ') || ''}
                    onChange={(e) => onEditChange('skills', 'certifications', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="用逗号分隔，如：AWS认证, PMP认证, CPA"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮 */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存简历'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal; 
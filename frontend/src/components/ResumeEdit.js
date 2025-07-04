/**
 * 简历编辑组件
 * 用于编辑简历的详细信息
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResumeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [editedResult, setEditedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /**
   * 加载简历详情
   */
  useEffect(() => {
    const loadResume = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`/api/resumes/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setResume(data.data);
          let resumeData = {};
          
          // 优先使用 resume_data 字段，然后是 content 字段
          if (data.data.resume_data) {
            resumeData = typeof data.data.resume_data === 'string' 
              ? JSON.parse(data.data.resume_data) 
              : data.data.resume_data;
          } else if (data.data.content) {
            resumeData = typeof data.data.content === 'string' 
              ? JSON.parse(data.data.content) 
              : data.data.content;
          }

          // 转换为 UNIFIED_RESUME_SCHEMA 格式
          const standardData = convertToUnifiedFormat(resumeData);
          setEditedResult(standardData);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error('加载简历失败:', error);
        setError('加载简历失败');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadResume();
    }
  }, [id, navigate]);

  /**
   * 转换为统一格式
   */
  const convertToUnifiedFormat = (data) => {
    if (!data) return getEmptyResumeData();

    return {
      profile: {
        name: data.profile?.name || data.personalInfo?.name || '',
        email: data.profile?.email || data.personalInfo?.email || '',
        phone: data.profile?.phone || data.personalInfo?.phone || '',
        location: data.profile?.location || data.personalInfo?.location || '',
        portfolio: data.profile?.portfolio || data.personalInfo?.portfolio || '',
        linkedin: data.profile?.linkedin || data.personalInfo?.linkedin || '',
        summary: data.profile?.summary || data.personalInfo?.summary || data.summary || ''
      },
      workExperience: Array.isArray(data.workExperience) ? data.workExperience :
                     Array.isArray(data.workExperiences) ? data.workExperiences : [],
      projectExperience: Array.isArray(data.projectExperience) ? data.projectExperience :
                        Array.isArray(data.projects) ? data.projects : [],
      education: Array.isArray(data.education) ? data.education :
                Array.isArray(data.educations) ? data.educations : [],
      skills: Array.isArray(data.skills) ? 
             (data.skills.length > 0 && data.skills[0].category ?
              data.skills : 
              [{ category: '技能', details: data.skills.join(', ') }]) :
             [],
      customSections: Array.isArray(data.customSections) ? data.customSections : []
    };
  };

  /**
   * 获取空的简历数据结构
   */
  const getEmptyResumeData = () => ({
    profile: {
      name: '',
      email: '',
      phone: '',
      location: '',
      portfolio: '',
      linkedin: '',
      summary: ''
    },
    workExperience: [],
    projectExperience: [],
    education: [],
    skills: [],
    customSections: []
  });

  /**
   * 处理编辑更改
   */
  const handleEditChange = (section, field, value) => {
    setEditedResult(prev => {
      const updated = { ...prev };
      
      if (section === 'skills' && field === 'details') {
        // 处理技能详情
        updated.skills = [{
          category: '技能',
          details: value
        }];
      } else if (section === 'profile') {
        // 处理个人信息
        updated.profile = {
          ...updated.profile,
          [field]: value
        };
      } else {
        // 处理其他字段
        if (!updated[section]) {
          updated[section] = {};
        }
        updated[section][field] = value;
      }
      
      return updated;
    });
  };

  /**
   * 添加工作经历
   */
  const handleAddExperience = () => {
    setEditedResult(prev => ({
      ...prev,
      workExperience: [
        ...(prev.workExperience || []),
        {
          company: '',
          position: '',
          duration: '',
          description: ''
        }
      ]
    }));
  };

  /**
   * 删除工作经历
   */
  const handleRemoveExperience = (index) => {
    setEditedResult(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  /**
   * 添加教育经历
   */
  const handleAddEducation = () => {
    setEditedResult(prev => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          school: '',
          degree: '',
          major: '',
          duration: ''
        }
      ]
    }));
  };

  /**
   * 删除教育经历
   */
  const handleRemoveEducation = (index) => {
    setEditedResult(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  /**
   * 添加项目经历
   */
  const handleAddProject = () => {
    setEditedResult(prev => ({
      ...prev,
      projectExperience: [
        ...(prev.projectExperience || []),
        {
          name: '',
          role: '',
          duration: '',
          description: '',
          url: ''
        }
      ]
    }));
  };

  /**
   * 删除项目经历
   */
  const handleRemoveProject = (index) => {
    setEditedResult(prev => ({
      ...prev,
      projectExperience: prev.projectExperience.filter((_, i) => i !== index)
    }));
  };

  /**
   * 添加技能
   */
  const handleAddSkill = () => {
    setEditedResult(prev => ({
      ...prev,
      skills: [
        ...(prev.skills || []),
        {
          category: '',
          details: ''
        }
      ]
    }));
  };

  /**
   * 删除技能
   */
  const handleRemoveSkill = (index) => {
    setEditedResult(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  /**
   * 保存简历
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_data: JSON.stringify(editedResult)
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('简历保存成功！');
        navigate('/resumes');
      } else {
        setError(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存简历失败:', error);
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Link
            to="/resumes"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            返回简历列表
          </Link>
        </div>
      </div>
    );
  }

  if (!resume || !editedResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">简历不存在</div>
          <Link
            to="/resumes"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            返回简历列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">编辑简历: {resume.title}</h1>
              <p className="mt-1 text-sm text-gray-500">修改简历信息</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存简历'}
              </button>
              <Link
                to={`/resume/${id}`}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                取消编辑
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-8">
            
            {/* 个人信息编辑 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">👤 个人信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={editedResult?.profile?.name || ''}
                    onChange={(e) => handleEditChange('profile', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="text"
                    value={editedResult?.profile?.phone || ''}
                    onChange={(e) => handleEditChange('profile', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入电话号码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={editedResult?.profile?.email || ''}
                    onChange={(e) => handleEditChange('profile', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <input
                    type="text"
                    value={editedResult?.profile?.location || ''}
                    onChange={(e) => handleEditChange('profile', 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="请输入居住地址"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={editedResult?.profile?.summary || ''}
                  onChange={(e) => handleEditChange('profile', 'summary', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="请输入个人简介"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">求职意向</label>
                <input
                  type="text"
                  value={editedResult?.profile?.objective || ''}
                  onChange={(e) => handleEditChange('profile', 'objective', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="请输入求职意向"
                />
              </div>
            </div>

            {/* 教育经历编辑 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">🎓 教育经历</h3>
                <button
                  onClick={handleAddEducation}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                >
                  + 添加教育经历
                </button>
              </div>
              <div className="space-y-4">
                {(editedResult?.education || []).map((edu, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-medium text-gray-900">教育经历 {index + 1}</h4>
                      <button
                        onClick={() => handleRemoveEducation(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">学校</label>
                        <input
                          type="text"
                          value={edu.school || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], school: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="学校名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">学位</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], degree: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="学位"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">专业</label>
                        <input
                          type="text"
                          value={edu.major || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], major: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="专业"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                        <input
                          type="text"
                          value={edu.gpa || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], gpa: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="GPA"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                        <input
                          type="text"
                          value={edu.startDate || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], startDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2018-09"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                        <input
                          type="text"
                          value={edu.endDate || ''}
                          onChange={(e) => {
                            const newEducations = [...(editedResult.education || [])];
                            newEducations[index] = { ...newEducations[index], endDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, education: newEducations }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2022-06"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                      <textarea
                        value={edu.description || ''}
                        onChange={(e) => {
                          const newEducations = [...(editedResult.education || [])];
                          newEducations[index] = { ...newEducations[index], description: e.target.value };
                          setEditedResult(prev => ({ ...prev, education: newEducations }));
                        }}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="教育经历描述"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 工作经历编辑 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">💼 工作经历</h3>
                <button
                  onClick={handleAddExperience}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                >
                  + 添加工作经历
                </button>
              </div>
              <div className="space-y-4">
                {(editedResult?.workExperience || []).map((work, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-medium text-gray-900">工作经历 {index + 1}</h4>
                      <button
                        onClick={() => handleRemoveExperience(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                        <input
                          type="text"
                          value={work.company || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], company: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="公司名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                        <input
                          type="text"
                          value={work.position || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], position: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="职位名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                        <input
                          type="text"
                          value={work.startDate || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], startDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2020-01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                        <input
                          type="text"
                          value={work.endDate || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], endDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2023-12 或 至今"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                        <input
                          type="text"
                          value={work.location || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], location: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="工作地点"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                        <input
                          type="text"
                          value={work.department || ''}
                          onChange={(e) => {
                            const newExperiences = [...(editedResult.workExperience || [])];
                            newExperiences[index] = { ...newExperiences[index], department: e.target.value };
                            setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="部门"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">工作描述</label>
                      <textarea
                        value={work.description || ''}
                        onChange={(e) => {
                          const newExperiences = [...(editedResult.workExperience || [])];
                          newExperiences[index] = { ...newExperiences[index], description: e.target.value };
                          setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                        }}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="工作职责和描述"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">主要成就</label>
                      <textarea
                        value={(work.achievements || []).join('\n')}
                        onChange={(e) => {
                          const newExperiences = [...(editedResult.workExperience || [])];
                          newExperiences[index] = { 
                            ...newExperiences[index], 
                            achievements: e.target.value.split('\n').filter(item => item.trim())
                          };
                          setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                        }}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="每行一个成就"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">技术栈</label>
                      <input
                        type="text"
                        value={(work.technologies || []).join(', ')}
                        onChange={(e) => {
                          const newExperiences = [...(editedResult.workExperience || [])];
                          newExperiences[index] = { 
                            ...newExperiences[index], 
                            technologies: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                          };
                          setEditedResult(prev => ({ ...prev, workExperience: newExperiences }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="用逗号分隔，如：React, Node.js, Python"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 项目经历编辑 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">🚀 项目经历</h3>
                <button
                  onClick={handleAddProject}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                >
                  + 添加项目经历
                </button>
              </div>
              <div className="space-y-4">
                {(editedResult?.projectExperience || []).map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-medium text-gray-900">项目经历 {index + 1}</h4>
                      <button
                        onClick={() => handleRemoveProject(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                        <input
                          type="text"
                          value={project.name || ''}
                          onChange={(e) => {
                            const newProjects = [...(editedResult.projectExperience || [])];
                            newProjects[index] = { ...newProjects[index], name: e.target.value };
                            setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="项目名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">担任角色</label>
                        <input
                          type="text"
                          value={project.role || ''}
                          onChange={(e) => {
                            const newProjects = [...(editedResult.projectExperience || [])];
                            newProjects[index] = { ...newProjects[index], role: e.target.value };
                            setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="在项目中的角色"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                        <input
                          type="text"
                          value={project.startDate || ''}
                          onChange={(e) => {
                            const newProjects = [...(editedResult.projectExperience || [])];
                            newProjects[index] = { ...newProjects[index], startDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2022-01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                        <input
                          type="text"
                          value={project.endDate || ''}
                          onChange={(e) => {
                            const newProjects = [...(editedResult.projectExperience || [])];
                            newProjects[index] = { ...newProjects[index], endDate: e.target.value };
                            setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：2022-12"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                      <textarea
                        value={project.description || ''}
                        onChange={(e) => {
                          const newProjects = [...(editedResult.projectExperience || [])];
                          newProjects[index] = { ...newProjects[index], description: e.target.value };
                          setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                        }}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="项目描述"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">项目成果</label>
                      <textarea
                        value={(project.achievements || []).join('\n')}
                        onChange={(e) => {
                          const newProjects = [...(editedResult.projectExperience || [])];
                          newProjects[index] = { 
                            ...newProjects[index], 
                            achievements: e.target.value.split('\n').filter(item => item.trim())
                          };
                          setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                        }}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="每行一个成果"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">技术栈</label>
                      <input
                        type="text"
                        value={(project.technologies || []).join(', ')}
                        onChange={(e) => {
                          const newProjects = [...(editedResult.projectExperience || [])];
                          newProjects[index] = { 
                            ...newProjects[index], 
                            technologies: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                          };
                          setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="用逗号分隔，如：React, Node.js, MongoDB"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">项目链接</label>
                      <input
                        type="url"
                        value={project.url || ''}
                        onChange={(e) => {
                          const newProjects = [...(editedResult.projectExperience || [])];
                          newProjects[index] = { ...newProjects[index], url: e.target.value };
                          setEditedResult(prev => ({ ...prev, projectExperience: newProjects }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="项目演示或代码链接"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 技能编辑 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">技能</h2>
              <div className="space-y-4">
                {(editedResult?.skills || []).map((skill, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold">技能 {index + 1}</h3>
                      <button
                        onClick={() => handleRemoveSkill(index)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        删除
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技能分类</label>
                        <input
                          type="text"
                          value={skill.category || ''}
                          onChange={(e) => {
                            const newSkills = [...(editedResult.skills || [])];
                            newSkills[index] = { ...newSkills[index], category: e.target.value };
                            setEditedResult(prev => ({ ...prev, skills: newSkills }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：前端技术、后端技术、设计技能"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技能详情</label>
                        <input
                          type="text"
                          value={skill.details || ''}
                          onChange={(e) => {
                            const newSkills = [...(editedResult.skills || [])];
                            newSkills[index] = { ...newSkills[index], details: e.target.value };
                            setEditedResult(prev => ({ ...prev, skills: newSkills }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="如：React, Vue, JavaScript, TypeScript"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddSkill}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  添加技能
                </button>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                to={`/resume/${id}`}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消编辑
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存简历'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEdit; 
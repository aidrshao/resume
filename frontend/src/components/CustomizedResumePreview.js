import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomizedResumeById } from '../utils/api';

const CustomizedResumePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomizedResume();
  }, [id]);

  const loadCustomizedResume = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 [PREVIEW] 加载定制简历，ID:', id);
      
      const response = await getCustomizedResumeById(id);
      
      if (response.success) {
        setResume(response.data);
        console.log('✅ [PREVIEW] 定制简历加载成功:', response.data);
      } else {
        setError(response.message || '加载定制简历失败');
      }
      
    } catch (error) {
      console.error('❌ [PREVIEW] 加载定制简历失败:', error);
      setError('加载定制简历失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/jobs');
  };

  const handleDownload = () => {
    // TODO: 实现下载功能
    alert('下载功能开发中...');
  };

  const handleShare = () => {
    // TODO: 实现分享功能
    alert('分享功能开发中...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载定制简历...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            返回岗位列表
          </button>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">定制简历不存在</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            返回岗位列表
          </button>
        </div>
      </div>
    );
  }

  const optimizedData = resume.optimizedData || {};
  const profile = optimizedData.profile || {};
  const workExperience = optimizedData.workExperience || [];
  const projectExperience = optimizedData.projectExperience || [];
  const education = optimizedData.education || [];
  const skills = optimizedData.skills || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部操作栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回岗位列表
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">定制简历预览</h1>
                <p className="text-sm text-gray-600">
                  基于「{resume.base_resume_title}」为「{resume.job_company} - {resume.job_title}」定制
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                分享
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载简历
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 简历内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 个人信息 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.name || '姓名'}</h1>
                <p className="text-xl text-blue-100 mb-4">{profile.title || '职位'}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {profile.phone && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {profile.phone}
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {profile.email}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* 个人简介 */}
            {profile.summary && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  个人简介
                </h2>
                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
              </div>
            )}

            {/* 工作经验 */}
            {workExperience.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                  </svg>
                  工作经验
                </h2>
                <div className="space-y-6">
                  {workExperience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                          <p className="text-blue-600 font-medium">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-500">{exp.duration}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{exp.description}</p>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {exp.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 项目经验 */}
            {projectExperience.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  项目经验
                </h2>
                <div className="space-y-6">
                  {projectExperience.map((project, index) => (
                    <div key={index} className="border-l-4 border-green-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-green-600 font-medium">{project.role}</p>
                        </div>
                        <span className="text-sm text-gray-500">{project.duration}</span>
                      </div>
                      <p className="text-gray-700 mb-3">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.technologies.map((tech, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.achievements && project.achievements.length > 0 && (
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {project.achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 教育背景 */}
            {education.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  教育背景
                </h2>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-purple-200 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                          <p className="text-purple-600 font-medium">{edu.school}</p>
                          <p className="text-gray-600">{edu.major}</p>
                        </div>
                        <span className="text-sm text-gray-500">{edu.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 技能 */}
            {skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  专业技能
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span className="text-sm text-gray-600">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizedResumePreview; 
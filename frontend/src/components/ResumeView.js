/**
 * 简历查看组件
 * 用于显示简历的详细信息
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResumeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
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
   * 获取状态显示文本
   */
  const getStatusText = (status) => {
    const statusMap = {
      'draft': '草稿',
      'generating': '生成中',
      'completed': '已完成',
      'failed': '生成失败'
    };
    return statusMap[status] || status;
  };

  /**
   * 获取状态样式
   */
  const getStatusStyle = (status) => {
    const styleMap = {
      'draft': 'bg-gray-100 text-gray-800',
      'generating': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styleMap[status] || 'bg-gray-100 text-gray-800';
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

  if (!resume) {
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

  const resumeData = typeof resume.resume_data === 'string' 
    ? JSON.parse(resume.resume_data) 
    : resume.resume_data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resume.title}</h1>
              <div className="mt-1 flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(resume.status)}`}
                >
                  {getStatusText(resume.status)}
                </span>
                {resume.generation_mode === 'advanced' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    AI优化
                  </span>
                )}
                {resume.is_base && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    基础简历
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/resume/${resume.id}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                编辑简历
              </Link>
              <Link
                to="/resumes"
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 简历信息卡片 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* 目标信息 */}
            {(resume.target_company || resume.target_position) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">目标岗位信息</h3>
                {resume.target_company && (
                  <p className="text-blue-800"><span className="font-medium">目标公司:</span> {resume.target_company}</p>
                )}
                {resume.target_position && (
                  <p className="text-blue-800"><span className="font-medium">目标岗位:</span> {resume.target_position}</p>
                )}
                {resume.job_description && (
                  <div className="mt-2">
                    <p className="font-medium text-blue-800">岗位描述:</p>
                    <p className="text-blue-700 text-sm whitespace-pre-wrap">{resume.job_description}</p>
                  </div>
                )}
              </div>
            )}

            {/* 个人信息 */}
            {resumeData?.personalInfo && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">👤 个人信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumeData.personalInfo.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">姓名</label>
                      <p className="mt-1 text-sm text-gray-900">{resumeData.personalInfo.name}</p>
                    </div>
                  )}
                  {resumeData.personalInfo.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">电话</label>
                      <p className="mt-1 text-sm text-gray-900">{resumeData.personalInfo.phone}</p>
                    </div>
                  )}
                  {resumeData.personalInfo.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">邮箱</label>
                      <p className="mt-1 text-sm text-gray-900">{resumeData.personalInfo.email}</p>
                    </div>
                  )}
                  {resumeData.personalInfo.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">地址</label>
                      <p className="mt-1 text-sm text-gray-900">{resumeData.personalInfo.location}</p>
                    </div>
                  )}
                </div>
                {resumeData.personalInfo.summary && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">个人简介</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{resumeData.personalInfo.summary}</p>
                  </div>
                )}
                {resumeData.personalInfo.objective && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">求职意向</label>
                    <p className="mt-1 text-sm text-gray-900">{resumeData.personalInfo.objective}</p>
                  </div>
                )}
              </div>
            )}

            {/* 教育经历 */}
            {resumeData?.educations && resumeData.educations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🎓 教育经历</h3>
                <div className="space-y-4">
                  {resumeData.educations.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{edu.school}</h4>
                          <p className="text-gray-700">{edu.degree} - {edu.major}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {edu.startDate} - {edu.endDate}
                        </div>
                      </div>
                      {edu.gpa && (
                        <p className="mt-2 text-sm text-gray-600">GPA: {edu.gpa}</p>
                      )}
                      {edu.description && (
                        <p className="mt-2 text-sm text-gray-600">{edu.description}</p>
                      )}
                      {edu.honors && edu.honors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">荣誉奖项:</p>
                          <p className="text-sm text-gray-600">{edu.honors.join(', ')}</p>
                        </div>
                      )}
                      {edu.courses && edu.courses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">主要课程:</p>
                          <p className="text-sm text-gray-600">{edu.courses.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 工作经历 */}
            {resumeData?.workExperiences && resumeData.workExperiences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">💼 工作经历</h3>
                <div className="space-y-4">
                  {resumeData.workExperiences.map((work, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{work.company}</h4>
                          <p className="text-gray-700">{work.position}</p>
                          {work.department && (
                            <p className="text-sm text-gray-600">{work.department}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {work.startDate} - {work.endDate}
                        </div>
                      </div>
                      {work.location && (
                        <p className="mt-1 text-sm text-gray-600">📍 {work.location}</p>
                      )}
                      {work.description && (
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{work.description}</p>
                      )}
                      {work.achievements && work.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">主要成就:</p>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                            {work.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {work.technologies && work.technologies.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">技术栈:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {work.technologies.map((tech, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {work.teamSize && (
                        <p className="mt-2 text-sm text-gray-600">团队规模: {work.teamSize}人</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 项目经历 */}
            {resumeData?.projects && resumeData.projects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🚀 项目经历</h3>
                <div className="space-y-4">
                  {resumeData.projects.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
                          {project.role && (
                            <p className="text-gray-700">{project.role}</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.startDate} - {project.endDate}
                        </div>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
                      )}
                      {project.achievements && project.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">项目成果:</p>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                            {project.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">技术栈:</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {project.technologies.map((tech, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {project.url && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium text-gray-700">项目链接:</span>
                          <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                            {project.url}
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 技能 */}
            {resumeData?.skills && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🛠️ 技能专长</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {resumeData.skills.technical && resumeData.skills.technical.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">技术技能</h4>
                      <div className="flex flex-wrap gap-1">
                        {resumeData.skills.technical.map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.skills.professional && resumeData.skills.professional.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">专业技能</h4>
                      <div className="flex flex-wrap gap-1">
                        {resumeData.skills.professional.map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.skills.soft && resumeData.skills.soft.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">软技能</h4>
                      <div className="flex flex-wrap gap-1">
                        {resumeData.skills.soft.map((skill, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {resumeData.skills.certifications && resumeData.skills.certifications.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">认证证书</h4>
                      <div className="flex flex-wrap gap-1">
                        {resumeData.skills.certifications.map((cert, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 语言能力 */}
            {resumeData?.languages && resumeData.languages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🌍 语言能力</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumeData.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{lang.language}</span>
                      <span className="text-sm text-gray-600">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 获奖情况 */}
            {resumeData?.awards && resumeData.awards.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🏆 获奖情况</h3>
                <div className="space-y-3">
                  {resumeData.awards.map((award, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{award.title}</h4>
                        {award.organization && (
                          <p className="text-sm text-gray-600">{award.organization}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{award.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 兴趣爱好 */}
            {resumeData?.interests && resumeData.interests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">🎯 兴趣爱好</h3>
                <div className="flex flex-wrap gap-2">
                  {resumeData.interests.map((interest, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 简历元信息 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">简历信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">创建时间:</span> {new Date(resume.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">更新时间:</span> {new Date(resume.updated_at).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">模板:</span> {resume.template_name || '默认模板'}
                </div>
                <div>
                  <span className="font-medium">生成模式:</span> {resume.generation_mode === 'advanced' ? 'AI优化模式' : '普通模式'}
                </div>
                {resume.source && (
                  <div>
                    <span className="font-medium">数据来源:</span> {resume.source === 'upload' ? '简历上传' : 'AI对话收集'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeView; 
/**
 * 简历展示组件
 * 接收data prop（resumeData.optimized_data），负责渲染简历内容
 */

import React from 'react';

const ResumeDisplay = ({ data }) => {
  // 如果没有数据，显示占位符
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // 解析优化后的简历数据
  let parsedData;
  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
    console.error('解析简历数据失败:', error);
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-red-800 font-medium">数据解析失败</h3>
          </div>
          <p className="text-red-700 mt-2">简历数据格式错误，请联系技术支持。</p>
        </div>
      </div>
    );
  }

  const { profile, workExperience, projectExperience, education, skills, customSections } = parsedData;

  return (
    <div className="bg-white shadow-sm rounded-lg p-8 max-w-4xl mx-auto">
      {/* 个人信息头部 */}
      <div className="mb-8 text-center border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {profile?.name || '姓名未填写'}
        </h1>
        
        {/* 联系方式 */}
        <div className="flex flex-wrap justify-center gap-4 text-gray-600 mb-4">
          {profile?.email && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {profile.email}
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {profile.phone}
            </div>
          )}
          {profile?.location && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {profile.location}
            </div>
          )}
        </div>

        {/* 个人简介 */}
        {profile?.summary && (
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto text-lg">
            {profile.summary}
          </p>
        )}
      </div>

      {/* 工作经验 */}
      {workExperience && workExperience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-1 h-8 bg-blue-500 mr-3"></div>
            工作经验
          </h2>
          <div className="space-y-6">
            {workExperience.map((exp, index) => (
              <div key={index} className="relative pl-6 border-l-2 border-gray-200 hover:border-blue-300 transition-colors">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{exp.position}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-blue-600 font-medium">{exp.company}</span>
                    {exp.duration && (
                      <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                </div>
                {exp.description && (
                  <div className="text-gray-700 leading-relaxed">
                    {Array.isArray(exp.description) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {exp.description.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{exp.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目经验 */}
      {projectExperience && projectExperience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-1 h-8 bg-green-500 mr-3"></div>
            项目经验
          </h2>
          <div className="space-y-6">
            {projectExperience.map((project, index) => (
              <div key={index} className="relative pl-6 border-l-2 border-gray-200 hover:border-green-300 transition-colors">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{project.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {project.role && (
                      <span className="text-green-600 font-medium">{project.role}</span>
                    )}
                    {project.duration && (
                      <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                        {project.duration}
                      </span>
                    )}
                  </div>
                </div>
                {project.description && (
                  <div className="text-gray-700 leading-relaxed mb-3">
                    {Array.isArray(project.description) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {project.description.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>{project.description}</p>
                    )}
                  </div>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 教育背景 */}
      {education && education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-1 h-8 bg-purple-500 mr-3"></div>
            教育背景
          </h2>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="relative pl-6 border-l-2 border-gray-200 hover:border-purple-300 transition-colors">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full"></div>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{edu.school}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-gray-600">
                    {edu.degree && <span className="font-medium">{edu.degree}</span>}
                    {edu.major && (
                      <>
                        {edu.degree && <span>·</span>}
                        <span>{edu.major}</span>
                      </>
                    )}
                    {edu.duration && (
                      <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full ml-auto">
                        {edu.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 专业技能 */}
      {skills && skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-1 h-8 bg-orange-500 mr-3"></div>
            专业技能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                  {skill.level && (
                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                      {skill.level}
                    </span>
                  )}
                </div>
                {skill.description && (
                  <p className="text-gray-600 text-sm">{skill.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 自定义部分 */}
      {customSections && customSections.length > 0 && (
        <div className="mb-8">
          {customSections.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-8 bg-indigo-500 mr-3"></div>
                {section.title}
              </h2>
              <div className="text-gray-700 leading-relaxed">
                {Array.isArray(section.content) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{section.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResumeDisplay;
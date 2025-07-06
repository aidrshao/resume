I'll generate a comprehensive code structure map for your project. Let me start by examining the backend and frontend source code.
Read file: backend/server.js
Read file: backend/controllers/authController.js
Read file: backend/controllers/resumeController.js
Read file: frontend/src/App.js
Read file: frontend/src/components/ResumeDashboard.js

Read file: backend/models/User.js
Read file: backend/models/Resume.js
Read file: backend/services/aiService.js
Read file: frontend/src/utils/api.js
Read file: frontend/src/components/ResumeBuilder.js
Read file: backend/routes/resumeRoutes.js

Read file: backend/routes/auth.js
Read file: backend/middleware/auth.js
Read file: frontend/src/components/LandingPage.js
Read file: frontend/src/components/AdminDashboard.js
Read file: backend/controllers/adminController.js
Read file: backend/services/pdfService.js

# 项目代码结构图

## 后端 (Backend)

### `backend/server.js`
- **Purpose**: Express服务器主文件，启动服务器并配置中间件和路由
- **Exports**: 无导出，直接启动服务器
- **Imports**: 
  - `./routes/auth`
  - `./routes/resumeRoutes`
  - `./routes/customizedResumeRoutes`
  - `./routes/jobRoutes`
  - `./routes/adminRoutes`
  - `./routes/membershipRoutes`
  - `./routes/resumeRenderRoutes`
  - `./routes/templateRoutes`
  - `./routes/logRoutes`

### `backend/controllers/authController.js`
- **Purpose**: 处理用户注册、登录、邮箱验证相关业务逻辑
- **Exports**: 
  - `sendVerificationCode(req, res)`
  - `verifyEmailCode(req, res)`
  - `register(req, res)`
  - `login(req, res)`
  - `loginWithCode(req, res)`
  - `resetPassword(req, res)`
  - `getProfile(req, res)`
  - `testEmailService(req, res)`
- **Imports**: 
  - `../models/User`
  - `../models/EmailVerification`
  - `../services/emailService`
  - `../utils/auth`
  - `../utils/validation`

### `backend/controllers/resumeController.js`
- **Purpose**: 处理简历相关的所有API请求
- **Exports**: 
  - `getUserResumes(req, res)`
  - `getResumeById(req, res)`
  - `createResume(req, res)`
  - `updateResume(req, res)`
  - `deleteResume(req, res)`
  - `uploadAndParseResume(req, res)`
  - `generateJobSpecificResume(req, res)`
  - `saveBaseResume(req, res)`
  - `generateResume(req, res)`
  - `getTaskStatus(req, res)`
  - `getTaskProgress(req, res)`
  - `getResumeTemplates(req, res)`
  - `getResumeSuggestions(req, res)`
  - `upload` (multer实例)
- **Imports**: 
  - `../models/Resume`
  - `../services/aiService`
  - `../services/resumeParseService`
  - `../controllers/membershipController`
  - `../config/database`

### `backend/controllers/adminController.js`
- **Purpose**: 处理管理员相关的业务逻辑
- **Exports**: 
  - `login(req, res)`
  - `getProfile(req, res)`
  - `createAdminAccount(req, res)`
  - `getAdmins(req, res)`
  - `getMembershipTiers(req, res)`
  - `createMembershipTier(req, res)`
  - `updateMembershipTier(req, res)`
  - `deleteMembershipTier(req, res)`
  - `toggleTierStatus(req, res)`
  - `getUserMemberships(req, res)`
  - `activateUserMembership(req, res)`
  - `updateUserMembership(req, res)`
  - `getUsers(req, res)`
  - `getStatistics(req, res)`
  - `updateUserStatus(req, res)`
  - `updateUser(req, res)`
  - `getUserDetail(req, res)`
  - `getUserQuotas(req, res)`
  - `resetUserQuotas(req, res)`
  - `grantMembership(req, res)`
  - `assignQuota(req, res)`
- **Imports**: 
  - `../middleware/adminAuth`
  - `../models/MembershipTier`
  - `../models/UserMembership`
  - `../models/User`
  - `../config/database`

### `backend/models/User.js`
- **Purpose**: 提供用户数据库操作方法
- **Exports**: 
  - `findByEmail(email)`
  - `findById(id)`
  - `create(userData)`
  - `updateById(id, updateData)`
  - `verifyEmail(email)`
  - `updatePassword(email, newPasswordHash)`
  - `isEmailVerified(email)`
  - `getStats()`
  - `findAllWithMembership(options)`
  - `findAllSimple(options)`
- **Imports**: 
  - `../utils/database`

### `backend/models/Resume.js`
- **Purpose**: 提供简历数据的CRUD操作，支持统一数据范式
- **Exports**: 
  - `testConnection()`
  - `create(resumeData)`
  - `findById(id)`
  - `findByIdAndUser(id, userId)`
  - `findByUserId(userId)`
  - `findListByUserId(userId)`
  - `findBaseResumeByUserId(userId)`
  - `update(id, updateData)`
  - `delete(id)`
  - `deleteByIdAndUser(id, userId)`
  - `updateStatus(id, status, log)`
  - `enrichResumeData(resume)`
  - `migrateToUnifiedSchema(id)`
  - `updateByIdAndUser(id, userId, updateData)`
- **Imports**: 
  - `../config/database`
  - `../schemas/schema`
  - `../utils/dataTransformer`

### `backend/services/aiService.js`
- **Purpose**: 集成DeepSeek和GPT-4o模型，提供文本生成和简历优化功能
- **Exports**: 
  - `generateText(prompt, model, options)`
  - `optimizeResumeForJob(resumeData, targetCompany, targetPosition, jobDescription, userRequirements)`
  - `smartFixJSON(rawContent)`
  - `repairCommonJSONErrors(jsonStr)`
  - `generateResumeSuggestions(resumeData)`
  - `collectUserInfoByChat(conversationHistory, userMessage, collectedInfo)`
- **Imports**: 
  - `../models/AIPrompt`

### `backend/services/pdfService.js`
- **Purpose**: 使用Puppeteer将HTML简历转换为PDF格式
- **Exports**: 
  - `generatePDF(html, options)`
  - `savePDFToFile(pdfBuffer, filename, directory)`
  - `generateResumePDF(html, resumeTitle, userId, options)`
  - `checkBrowserAvailable()`
- **Imports**: 无内部依赖

### `backend/routes/auth.js`
- **Purpose**: 定义用户注册、登录、邮箱验证相关API路由
- **Exports**: Express路由器
- **Imports**: 
  - `../controllers/authController`
  - `../utils/auth`

### `backend/routes/resumeRoutes.js`
- **Purpose**: 定义简历功能的所有API端点
- **Exports**: Express路由器
- **Imports**: 
  - `../controllers/resumeController`
  - `../controllers/aiChatController`
  - `../middleware/auth`

### `backend/middleware/auth.js`
- **Purpose**: 验证用户身份和权限的JWT认证中间件
- **Exports**: 
  - `authenticateToken(req, res, next)`
  - `verifyToken(req, res, next)` (别名)
  - `optionalAuth(req, res, next)`
- **Imports**: 
  - `../utils/auth`

## 前端 (Frontend)

### `frontend/src/App.js`
- **Purpose**: React主应用组件，配置应用路由和全局布局
- **Exports**: `App` (默认导出)
- **Imports**: 
  - `./utils/logger`
  - `./components/LandingPage`
  - `./components/LoginPage`
  - `./components/RegisterPage`
  - `./components/ProfilePage`
  - `./components/ResumeDashboard`
  - `./components/ResumeView`
  - `./components/ResumeEdit`
  - `./components/AIChatPage`
  - `./components/JobsPage`
  - `./components/ProtectedRoute`
  - `./components/AdminLogin`
  - `./components/AdminDashboard`
  - `./components/AdminUserManagement`
  - `./components/AdminMembershipTiers`
  - `./components/AdminUserMembershipManagement`
  - `./components/AdminAIPromptManagement`
  - `./components/AdminGlobalQuotaManagement`
  - `./components/TemplateManagement`
  - `./components/ResumeBuilder`
  - `./components/MembershipPage`
  - `./components/AdminProtectedRoute`
  - `./components/ResumePreviewPage`
  - `./components/TemplateTestPage`
- **State/Props**: 
  - `hasError` (错误边界状态)

### `frontend/src/components/ResumeDashboard.js`
- **Purpose**: 显示基础简历和AI定制简历，提供创建、编辑、删除功能
- **Exports**: `ResumeDashboard` (默认导出)
- **Imports**: 
  - `../utils/api`
  - `./ResumeRenderer`
- **State/Props**: 
  - `resumes` (简历列表)
  - `customizedResumes` (定制简历列表)
  - `loading` (加载状态)
  - `error` (错误信息)
  - `baseResume` (基础简历)
  - `retryCount` (重试次数)
  - `retrying` (重试状态)
  - `showTemplateModal` (模板选择弹窗)
  - `selectedResumeForTemplate` (选中的简历)
  - `templates` (模板列表)
  - `selectedTemplate` (选中的模板)
  - `renderError` (渲染错误)
  - `pdfGenerating` (PDF生成状态)

### `frontend/src/components/ResumeBuilder.js`
- **Purpose**: 提供模板选择、简历内容编辑和实时预览功能
- **Exports**: `ResumeBuilder` (默认导出)
- **Imports**: 无内部依赖
- **State/Props**: 
  - `templates` (模板列表)
  - `selectedTemplate` (选中的模板)
  - `templateDetail` (模板详情)
  - `templatesLoading` (模板加载状态)
  - `templateDetailLoading` (模板详情加载状态)
  - `resumeData` (简历数据)
  - `renderedHtml` (渲染后的HTML)
  - `renderError` (渲染错误)
  - `pdfGenerating` (PDF生成状态)

### `frontend/src/components/LandingPage.js`
- **Purpose**: 俊才AI简历产品首页，突出产品价值和流程
- **Exports**: `LandingPage` (默认导出)
- **Imports**: 
  - `../utils/auth`
  - `./AuthModal`
  - `./EditModal`
  - `./ResumeProgressBar`
- **State/Props**: 
  - `showAuthModal` (认证弹窗)
  - `authMode` (认证模式)
  - `showEditModal` (编辑弹窗)
  - `selectedMode` (选择的模式)
  - `pendingAction` (待执行操作)
  - `uploadFile` (上传文件)
  - `uploadLoading` (上传加载状态)
  - `uploadProgress` (上传进度)
  - `uploadStage` (上传阶段)
  - `uploadResult` (上传结果)
  - `editedResult` (编辑结果)
  - `progressStatus` (进度状态)
  - `progressMessage` (进度消息)
  - `chatMessages` (聊天消息)
  - `chatInput` (聊天输入)
  - `chatLoading` (聊天加载状态)

### `frontend/src/components/AdminDashboard.js`
- **Purpose**: 管理员仪表板主页面，显示系统概览和快捷操作
- **Exports**: `AdminDashboard` (默认导出)
- **Imports**: 无内部依赖
- **State/Props**: 
  - `statistics` (统计信息)
  - `loading` (加载状态)
  - `adminInfo` (管理员信息)

### `frontend/src/utils/api.js`
- **Purpose**: 封装axios请求，统一处理认证和错误
- **Exports**: 
  - `API_BASE_URL`
  - `register(userData)`
  - `login(credentials)`
  - `sendVerificationCode(data)`
  - `loginWithCode(credentials)`
  - `verifyEmailCode(data)`
  - `resetPassword(data)`
  - `getUserProfile()`
  - `getJobs(params)`
  - `getJobById(jobId)`
  - `createJob(jobData)`
  - `uploadJobFile(formData)`
  - `updateJob(jobId, updateData)`
  - `deleteJob(jobId)`
  - `batchUpdateJobStatus(jobIds, status)`
  - `getJobStats()`
  - `getResumes(params)`
  - `getResumeById(resumeId)`
  - `createResume(resumeData)`
  - `updateResume(resumeId, updateData)`
  - `deleteResume(resumeId)`
  - `generateJobSpecificResume(data)`
  - `checkCustomizedResumeExists(data)`
  - `customizeResume(data)`
  - `getCustomizedResumes(params)`
  - `getCustomizedResumeById(customizedResumeId)`
  - `deleteCustomizedResume(customizedResumeId)`
  - `getResumeTemplates()`
  - `getTemplatesList()`
  - `getTemplateById(templateId)`
  - `generateResumePreview(data)`
  - `generateResumePDF(data)`
  - `downloadResumePDF(filename)`
- **Imports**: 
  - `./logger`

### `frontend/src/utils/auth.js`
- **Purpose**: 处理前端认证相关逻辑
- **Exports**: 认证工具函数
- **Imports**: 无内部依赖

### `frontend/src/utils/logger.js`
- **Purpose**: 前端日志记录工具
- **Exports**: 日志记录函数
- **Imports**: 无内部依赖

## 核心业务流程

### 认证流程
1. **用户注册/登录**: `authController.js` → `User.js` → `emailService.js`
2. **JWT验证**: `auth.js` (middleware) → `auth.js` (utils)
3. **前端认证**: `auth.js` (utils) → `api.js` → `AuthModal.js`

### 简历管理流程
1. **简历CRUD**: `resumeController.js` → `Resume.js` → `ResumeDashboard.js`
2. **AI生成**: `aiService.js` → `ResumeBuilder.js` → `LandingPage.js`
3. **PDF导出**: `pdfService.js` → `resumeController.js` → `ResumeDashboard.js`

### 管理员功能
1. **管理员认证**: `adminController.js` → `adminAuth.js` → `AdminLogin.js`
2. **用户管理**: `adminController.js` → `User.js` → `AdminDashboard.js`
3. **系统统计**: `adminController.js` → 各模型 → `AdminDashboard.js`
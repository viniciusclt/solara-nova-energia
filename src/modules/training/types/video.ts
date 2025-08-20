// types/video.ts
export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number;
  size: number;
  format: VideoFormat;
  resolution: VideoResolution;
  thumbnails: string[];
  chapters?: VideoChapter[];
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: VideoStatus;
  moduleId: string;
  category: VideoCategory;
  accessLevel: AccessLevel;
}

export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'avi';
export type VideoResolution = '360p' | '720p' | '1080p' | '4k';
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'error';
export type VideoCategory = 'comercial' | 'engenharia' | 'instalacao' | 'geral';
export type AccessLevel = 'basico' | 'intermediario' | 'avancado';

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface VideoUploadConfig {
  maxFileSize: number; // bytes
  supportedFormats: VideoFormat[];
  chunkSize: number; // bytes
  compressionQualities: VideoResolution[];
  watermarkConfig: WatermarkConfig;
}

export interface WatermarkConfig {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
}

export interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  watchedSegments: TimeRange[];
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  dropOffPoints: number[];
  viewsByDay: { date: string; views: number }[];
}

export interface VideoSecurityConfig {
  tokenExpiration: number; // seconds
  domainRestriction: string[];
  downloadProtection: boolean;
  watermarkEnabled: boolean;
  viewTracking: boolean;
}

export interface VideoStreamingUrls {
  '360p': string;
  '720p': string;
  '1080p': string;
  '4k'?: string;
  thumbnail: string;
  preview: string;
}

export interface VideoUploadResult {
  videoId: string;
  uploadUrl: string;
  processingStatus: VideoStatus;
  estimatedProcessingTime: number;
  thumbnailUrls: string[];
}

export interface VideoPlayerConfig {
  autoPlay: boolean;
  showControls: boolean;
  enableDownload: boolean;
  enableFullscreen: boolean;
  enablePictureInPicture: boolean;
  playbackRates: number[];
  defaultQuality: VideoResolution;
  watermark: WatermarkConfig;
  analytics: boolean;
}

export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number; // video timestamp
  createdAt: Date;
  replies?: VideoComment[];
}

export interface VideoNote {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  timestamp: number;
  isPrivate: boolean;
  createdAt: Date;
}

export interface VideoQuiz {
  id: string;
  videoId: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface VideoInteraction {
  id: string;
  videoId: string;
  userId: string;
  type: 'play' | 'pause' | 'seek' | 'quality_change' | 'speed_change' | 'fullscreen';
  timestamp: number;
  value?: unknown;
  createdAt: Date;
}

export interface VideoProcessingJob {
  id: string;
  videoId: string;
  type: 'compression' | 'thumbnail' | 'watermark' | 'analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface VideoStorageInfo {
  originalSize: number;
  compressedSizes: Record<VideoResolution, number>;
  totalStorage: number;
  storageLocation: string;
  backupLocation?: string;
  cdnUrls: VideoStreamingUrls;
}

export interface VideoAccessLog {
  id: string;
  videoId: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  accessedAt: Date;
  duration: number;
  quality: VideoResolution;
  completed: boolean;
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description?: string;
  videoIds: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoTranscript {
  id: string;
  videoId: string;
  language: string;
  segments: TranscriptSegment[];
  generatedAt: Date;
  accuracy?: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface VideoSubtitle {
  id: string;
  videoId: string;
  language: string;
  url: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface VideoThumbnailConfig {
  count: number;
  intervals: number[]; // percentages: [10, 30, 50, 70, 90]
  width: number;
  height: number;
  quality: number; // 0-1
  format: 'jpeg' | 'png' | 'webp';
}

export interface VideoCompressionConfig {
  qualities: VideoResolution[];
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrates: Record<VideoResolution, number>;
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: number;
}

export interface VideoSearchFilters {
  category?: VideoCategory;
  accessLevel?: AccessLevel;
  status?: VideoStatus;
  uploadedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  duration?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface VideoSearchResult {
  videos: VideoMetadata[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface VideoRecommendation {
  videoId: string;
  score: number;
  reason: 'similar_content' | 'same_category' | 'user_behavior' | 'trending';
}

export interface VideoEngagementMetrics {
  videoId: string;
  likes: number;
  dislikes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  averageRating: number;
  engagementRate: number;
}

export interface VideoLearningPath {
  id: string;
  title: string;
  description: string;
  videoIds: string[];
  prerequisites?: string[];
  estimatedDuration: number;
  difficulty: AccessLevel;
  category: VideoCategory;
  createdBy: string;
  isPublic: boolean;
}

export interface VideoCompletionCertificate {
  id: string;
  userId: string;
  videoId: string;
  completedAt: Date;
  score?: number;
  certificateUrl: string;
  isValid: boolean;
}

export interface VideoStreamingStats {
  videoId: string;
  currentViewers: number;
  peakViewers: number;
  totalBandwidth: number;
  qualityDistribution: Record<VideoResolution, number>;
  geographicDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
}

export interface VideoModerationFlag {
  id: string;
  videoId: string;
  flaggedBy: string;
  reason: 'inappropriate' | 'copyright' | 'spam' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface VideoBackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number; // days
  locations: string[];
  encryption: boolean;
  compression: boolean;
}

export interface VideoAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface VideoUploadChunk {
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  checksum: string;
  data: ArrayBuffer;
}

export interface VideoUploadSession {
  sessionId: string;
  videoId: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  expiresAt: Date;
  createdAt: Date;
}

export interface VideoQualityMetrics {
  videoId: string;
  resolution: VideoResolution;
  bitrate: number;
  frameRate: number;
  codec: string;
  fileSize: number;
  duration: number;
  qualityScore: number; // 0-100
  artifacts: string[];
}

export interface VideoContentAnalysis {
  videoId: string;
  topics: string[];
  keywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
  visualElements: string[];
  estimatedReadingTime: number;
}

export interface VideoPerformanceMetrics {
  videoId: string;
  loadTime: number;
  bufferingEvents: number;
  qualitySwitches: number;
  errorRate: number;
  rebufferRatio: number;
  startupTime: number;
  bitrateEfficiency: number;
}

export interface VideoAccessControl {
  videoId: string;
  isPublic: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
  allowedDomains: string[];
  geographicRestrictions: string[];
  timeRestrictions?: {
    start: Date;
    end: Date;
  };
  maxViews?: number;
  requiresAuthentication: boolean;
}

export interface VideoVersioning {
  videoId: string;
  version: number;
  previousVersions: string[];
  changelog: string;
  isLatest: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface VideoCollaboration {
  videoId: string;
  collaborators: {
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    permissions: string[];
    addedAt: Date;
  }[];
  shareSettings: {
    allowComments: boolean;
    allowDownload: boolean;
    allowSharing: boolean;
    expiresAt?: Date;
  };
}

export interface VideoAIInsights {
  videoId: string;
  autoGeneratedTags: string[];
  suggestedTitle: string;
  suggestedDescription: string;
  contentWarnings: string[];
  accessibilityIssues: string[];
  optimizationSuggestions: string[];
  similarVideos: string[];
  targetAudience: string[];
  estimatedEngagement: number;
}

export interface VideoExportOptions {
  format: VideoFormat;
  quality: VideoResolution;
  includeSubtitles: boolean;
  includeChapters: boolean;
  watermark: boolean;
  compression: 'none' | 'low' | 'medium' | 'high';
  outputPath: string;
}

export interface VideoImportOptions {
  source: 'file' | 'url' | 'youtube' | 'vimeo';
  sourceUrl?: string;
  preserveQuality: boolean;
  autoGenerateThumbnails: boolean;
  autoGenerateChapters: boolean;
  extractAudio: boolean;
  metadata: Partial<VideoMetadata>;
}

export interface VideoScheduling {
  videoId: string;
  publishAt: Date;
  unpublishAt?: Date;
  timezone: string;
  notifySubscribers: boolean;
  autoPromote: boolean;
  scheduledBy: string;
  status: 'scheduled' | 'published' | 'unpublished';
}

export interface VideoLiveStream {
  id: string;
  title: string;
  description: string;
  streamKey: string;
  streamUrl: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  maxViewers: number;
  currentViewers: number;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  recordingUrl?: string;
}

export interface VideoChat {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isModerated: boolean;
  reactions: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

export interface VideoNotification {
  id: string;
  userId: string;
  type: 'upload' | 'comment' | 'like' | 'share' | 'mention' | 'system';
  title: string;
  message: string;
  videoId?: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface VideoSubscription {
  id: string;
  userId: string;
  channelId: string;
  notificationSettings: {
    newVideos: boolean;
    liveStreams: boolean;
    comments: boolean;
    mentions: boolean;
  };
  subscribedAt: Date;
}

export interface VideoChannel {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoPlaybackSession {
  id: string;
  videoId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  quality: VideoResolution;
  device: string;
  browser: string;
  location: {
    country: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  events: {
    type: string;
    timestamp: number;
    data?: unknown;
  }[];
}

export interface VideoReporting {
  videoId: string;
  reportType: 'analytics' | 'performance' | 'engagement' | 'revenue';
  dateRange: {
    start: Date;
    end: Date;
  };
  metrics: Record<string, unknown>;
  charts: {
    type: string;
    data: Array<Record<string, unknown>>;
    config: Record<string, unknown>;
  }[];
  generatedAt: Date;
  generatedBy: string;
}

export interface VideoIntegration {
  id: string;
  videoId: string;
  platform: 'youtube' | 'vimeo' | 'facebook' | 'linkedin' | 'twitter';
  externalId: string;
  syncEnabled: boolean;
  lastSyncAt?: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
  settings: Record<string, unknown>;
}

export interface VideoWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: {
    type: 'upload' | 'status_change' | 'schedule' | 'manual';
    conditions: Record<string, unknown>;
  }[];
  actions: {
    type: string;
    config: Record<string, unknown>;
    order: number;
  }[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: VideoCategory;
  thumbnailUrl: string;
  previewUrl: string;
  duration: number;
  elements: {
    type: 'text' | 'image' | 'video' | 'audio' | 'shape';
    properties: Record<string, unknown>;
    timeline: {
      start: number;
      end: number;
    };
  }[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
  tags: string[];
}

export interface VideoEditor {
  id: string;
  videoId: string;
  timeline: {
    tracks: {
      id: string;
      type: 'video' | 'audio' | 'text' | 'image';
      clips: {
        id: string;
        start: number;
        end: number;
        duration: number;
        source: string;
        effects: unknown[];
        transitions: unknown[];
      }[];
    }[];
    duration: number;
    fps: number;
  };
  settings: {
    resolution: VideoResolution;
    frameRate: number;
    audioSampleRate: number;
    outputFormat: VideoFormat;
  };
  history: {
    action: string;
    timestamp: Date;
    data: unknown;
  }[];
  lastSavedAt: Date;
}

export interface VideoConference {
  id: string;
  title: string;
  description: string;
  hostId: string;
  participants: {
    userId: string;
    role: 'host' | 'presenter' | 'attendee';
    joinedAt: Date;
    leftAt?: Date;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
  }[];
  settings: {
    maxParticipants: number;
    requiresPassword: boolean;
    allowRecording: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    waitingRoom: boolean;
  };
  status: 'scheduled' | 'active' | 'ended';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  recordingUrl?: string;
}

export interface VideoGameification {
  videoId: string;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: string;
    points: number;
    unlockedBy: string[];
  }[];
  leaderboard: {
    userId: string;
    userName: string;
    score: number;
    rank: number;
    badges: string[];
  }[];
  challenges: {
    id: string;
    name: string;
    description: string;
    type: 'watch_time' | 'quiz_score' | 'completion' | 'engagement';
    target: number;
    reward: {
      type: 'points' | 'badge' | 'certificate';
      value: unknown;
    };
    startDate: Date;
    endDate: Date;
    participants: string[];
  }[];
}

export interface VideoAccessibility {
  videoId: string;
  features: {
    closedCaptions: boolean;
    audioDescription: boolean;
    signLanguage: boolean;
    highContrast: boolean;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
  };
  compliance: {
    wcag21AA: boolean;
    section508: boolean;
    ada: boolean;
  };
  alternativeFormats: {
    audioOnly: string;
    transcript: string;
    summary: string;
  };
}

export interface VideoMonetization {
  videoId: string;
  model: 'free' | 'premium' | 'pay_per_view' | 'subscription';
  pricing: {
    amount: number;
    currency: string;
    billingPeriod?: 'monthly' | 'yearly';
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  paymentMethods: string[];
  discounts: {
    code: string;
    percentage: number;
    validUntil: Date;
    usageLimit: number;
    usedCount: number;
  }[];
}

export interface VideoCompliance {
  videoId: string;
  regulations: {
    gdpr: boolean;
    coppa: boolean;
    ccpa: boolean;
    dmca: boolean;
  };
  contentRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  ageRestriction: number;
  geographicRestrictions: string[];
  contentWarnings: string[];
  copyrightInfo: {
    owner: string;
    license: string;
    attribution: string;
    commercialUse: boolean;
  };
}

export interface VideoMigration {
  id: string;
  sourceVideoId: string;
  targetVideoId: string;
  migrationType: 'platform' | 'storage' | 'format' | 'quality';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  settings: Record<string, unknown>;
}

export interface VideoAudit {
  id: string;
  videoId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

export interface VideoHealth {
  videoId: string;
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    lastChecked: Date;
  }[];
  uptime: number;
  availability: number;
  performance: {
    loadTime: number;
    throughput: number;
    errorRate: number;
  };
  lastHealthCheck: Date;
}

export interface VideoCache {
  videoId: string;
  cacheKey: string;
  cacheType: 'metadata' | 'thumbnail' | 'preview' | 'chunk';
  size: number;
  hitCount: number;
  missCount: number;
  lastAccessed: Date;
  expiresAt: Date;
  isValid: boolean;
}

export interface VideoQueue {
  id: string;
  videoId: string;
  jobType: 'upload' | 'processing' | 'compression' | 'analysis';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

export interface VideoEvent {
  id: string;
  videoId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  source: 'player' | 'api' | 'system' | 'user';
  processed: boolean;
}

export interface VideoFeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  targetUsers?: string[];
  targetRoles?: string[];
  rolloutPercentage: number;
  conditions?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface VideoExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: {
    name: string;
    weight: number;
    config: Record<string, unknown>;
  }[];
  metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  results?: Record<string, unknown>;
  significance?: number;
  winner?: string;
}

export interface VideoPersonalization {
  userId: string;
  preferences: {
    defaultQuality: VideoResolution;
    autoPlay: boolean;
    playbackSpeed: number;
    subtitles: boolean;
    subtitleLanguage: string;
    theme: 'light' | 'dark' | 'auto';
  };
  recommendations: VideoRecommendation[];
  watchHistory: {
    videoId: string;
    watchedAt: Date;
    duration: number;
    completed: boolean;
  }[];
  interests: string[];
  skillLevel: Record<VideoCategory, AccessLevel>;
}

export interface VideoSecurity {
  videoId: string;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  accessTokens: {
    token: string;
    userId: string;
    expiresAt: Date;
    permissions: string[];
    isActive: boolean;
  }[];
  ipWhitelist: string[];
  ipBlacklist: string[];
  rateLimiting: {
    maxRequests: number;
    windowSize: number; // seconds
    blockDuration: number; // seconds
  };
  fraudDetection: {
    enabled: boolean;
    suspiciousActivities: {
      type: string;
      description: string;
      detectedAt: Date;
      severity: 'low' | 'medium' | 'high';
    }[];
  };
}

export interface VideoEnvironment {
  name: 'development' | 'staging' | 'production';
  config: {
    apiUrl: string;
    cdnUrl: string;
    streamingUrl: string;
    uploadUrl: string;
    maxFileSize: number;
    supportedFormats: VideoFormat[];
    features: string[];
  };
  secrets: {
    apiKey: string;
    encryptionKey: string;
    signingKey: string;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsEnabled: boolean;
    tracingEnabled: boolean;
  };
}

export interface VideoSDK {
  version: string;
  platform: 'web' | 'ios' | 'android' | 'react-native' | 'flutter';
  features: string[];
  configuration: Record<string, unknown>;
  authentication: {
    apiKey: string;
    secretKey: string;
    tokenUrl: string;
  };
  endpoints: {
    upload: string;
    stream: string;
    analytics: string;
    management: string;
  };
  callbacks: {
    onUploadProgress?: (progress: UploadProgress) => void;
    onUploadComplete?: (result: VideoUploadResult) => void;
    onUploadError?: (error: Error) => void;
    onPlaybackStart?: (videoId: string) => void;
    onPlaybackEnd?: (videoId: string) => void;
    onError?: (error: Error) => void;
  };
}

export interface VideoPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  enabled: boolean;
  config: Record<string, unknown>;
  hooks: {
    beforeUpload?: (file: File) => Promise<File>;
    afterUpload?: (result: VideoUploadResult) => Promise<void>;
    beforePlay?: (videoId: string) => Promise<boolean>;
    afterPlay?: (videoId: string) => Promise<void>;
    onError?: (error: Error) => Promise<void>;
  };
  permissions: string[];
  dependencies: string[];
  installDate: Date;
  lastUpdate: Date;
}

export interface VideoTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  animations: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
  components: Record<string, Record<string, unknown>>;
}

export interface VideoLocalization {
  videoId: string;
  languages: {
    code: string;
    name: string;
    isDefault: boolean;
    title: string;
    description: string;
    subtitles?: string;
    audioTrack?: string;
    transcript?: string;
  }[];
  autoTranslation: {
    enabled: boolean;
    provider: 'google' | 'azure' | 'aws' | 'custom';
    confidence: number;
  };
  regionalization: {
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    currency: string;
  };
}

export interface VideoTesting {
  videoId: string;
  testSuites: {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    tests: {
      name: string;
      status: 'pass' | 'fail' | 'skip';
      duration: number;
      error?: string;
    }[];
    coverage: number;
    lastRun: Date;
  }[];
  automatedTesting: {
    enabled: boolean;
    schedule: string; // cron expression
    triggers: string[];
  };
  performanceBenchmarks: {
    metric: string;
    target: number;
    current: number;
    trend: 'improving' | 'stable' | 'degrading';
  }[];
}

export interface VideoDocumentation {
  videoId: string;
  sections: {
    title: string;
    content: string;
    type: 'markdown' | 'html' | 'text';
    order: number;
    lastUpdated: Date;
    updatedBy: string;
  }[];
  apiReference: {
    endpoints: {
      method: string;
      path: string;
      description: string;
      parameters: unknown[];
      responses: unknown[];
      examples: unknown[];
    }[];
  };
  changelog: {
    version: string;
    date: Date;
    changes: string[];
    breaking: boolean;
  }[];
  faq: {
    question: string;
    answer: string;
    category: string;
    helpful: number;
  }[];
}

export interface VideoLicense {
  videoId: string;
  type: 'free' | 'commercial' | 'educational' | 'custom';
  terms: string;
  permissions: {
    view: boolean;
    download: boolean;
    modify: boolean;
    redistribute: boolean;
    commercialUse: boolean;
  };
  restrictions: {
    attribution: boolean;
    shareAlike: boolean;
    noDerivatives: boolean;
    nonCommercial: boolean;
  };
  expiresAt?: Date;
  licensee?: {
    name: string;
    email: string;
    organization: string;
  };
  cost?: {
    amount: number;
    currency: string;
    billingPeriod: string;
  };
}

export interface VideoMetrics {
  videoId: string;
  timestamp: Date;
  metrics: {
    views: number;
    uniqueViews: number;
    watchTime: number;
    averageWatchTime: number;
    completionRate: number;
    engagementRate: number;
    likeRate: number;
    shareRate: number;
    commentRate: number;
    subscriptionRate: number;
    clickThroughRate: number;
    bounceRate: number;
    retentionRate: Record<number, number>; // percentage at each time point
    qualityDistribution: Record<VideoResolution, number>;
    deviceDistribution: Record<string, number>;
    geographicDistribution: Record<string, number>;
    trafficSources: Record<string, number>;
    conversionRate: number;
    revenue: number;
  };
  comparisons: {
    previousPeriod: Record<string, number>;
    benchmark: Record<string, number>;
    industry: Record<string, number>;
  };
}

export interface VideoOptimization {
  videoId: string;
  recommendations: {
    type: 'title' | 'description' | 'thumbnail' | 'tags' | 'timing' | 'quality';
    priority: 'low' | 'medium' | 'high';
    description: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  }[];
  abTests: {
    id: string;
    element: string;
    variants: unknown[];
    winner?: unknown;
    confidence: number;
    status: 'running' | 'completed' | 'paused';
  }[];
  seoScore: number;
  accessibilityScore: number;
  performanceScore: number;
  engagementScore: number;
}

export interface VideoWorkspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: {
    userId: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    permissions: string[];
    joinedAt: Date;
  }[];
  videos: string[];
  folders: {
    id: string;
    name: string;
    parentId?: string;
    videoIds: string[];
    createdAt: Date;
  }[];
  settings: {
    defaultPrivacy: 'public' | 'private' | 'unlisted';
    allowComments: boolean;
    allowDownloads: boolean;
    requireApproval: boolean;
    brandingEnabled: boolean;
  };
  storage: {
    used: number;
    limit: number;
    unit: 'bytes' | 'mb' | 'gb' | 'tb';
  };
  billing: {
    plan: string;
    status: 'active' | 'suspended' | 'cancelled';
    nextBilling: Date;
    usage: Record<string, number>;
  };
}

export interface VideoAPI {
  baseUrl: string;
  version: string;
  authentication: {
    type: 'api_key' | 'oauth' | 'jwt';
    credentials: Record<string, string>;
  };
  rateLimit: {
    requests: number;
    window: number; // seconds
    remaining: number;
    resetAt: Date;
  };
  endpoints: {
    upload: string;
    stream: string;
    metadata: string;
    analytics: string;
    search: string;
    management: string;
  };
  webhooks: {
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
  }[];
  sdks: {
    javascript: string;
    python: string;
    php: string;
    ruby: string;
    java: string;
    csharp: string;
  };
}

export interface VideoError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  videoId?: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'upload' | 'playback' | 'processing' | 'network' | 'auth' | 'system';
  isRetryable: boolean;
  retryCount?: number;
  resolution?: {
    status: 'pending' | 'in_progress' | 'resolved' | 'wont_fix';
    description?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
  };
}

export interface VideoSuccess {
  message: string;
  data?: unknown;
  timestamp: Date;
  requestId: string;
  duration: number;
  cached: boolean;
  version: string;
}

// Utility types
export type VideoEventHandler<T = unknown> = (event: T) => void | Promise<void>;
export type VideoMiddleware = (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) => void;
export type VideoValidator<T> = (data: T) => boolean | string[];
export type VideoTransformer<T, U> = (input: T) => U | Promise<U>;
export type VideoFilter<T> = (item: T) => boolean;
export type VideoSorter<T> = (a: T, b: T) => number;
export type VideoReducer<T, U> = (accumulator: U, current: T, index: number, array: T[]) => U;
export type VideoMapper<T, U> = (item: T, index: number, array: T[]) => U;
export type VideoPredicate<T> = (item: T) => boolean;
export type VideoComparator<T> = (a: T, b: T) => number;
export type VideoSerializer<T> = (data: T) => string;
export type VideoDeserializer<T> = (data: string) => T;
export type VideoEncoder<T> = (data: T) => ArrayBuffer;
export type VideoDecoder<T> = (data: ArrayBuffer) => T;
export type VideoCompressor<T> = (data: T) => Promise<T>;
export type VideoDecompressor<T> = (data: T) => Promise<T>;
export type VideoEncryptor = (data: string, key: string) => string;
export type VideoDecryptor = (data: string, key: string) => string;
export type VideoHasher = (data: string) => string;
export type VideoSigner = (data: string, secret: string) => string;
export type VideoVerifier = (data: string, signature: string, secret: string) => boolean;

// Constants
export const VIDEO_CONSTANTS = {
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024, // 2GB
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ['mp4', 'webm', 'mov', 'avi'] as VideoFormat[],
  DEFAULT_QUALITIES: ['360p', '720p', '1080p'] as VideoResolution[],
  THUMBNAIL_COUNT: 5,
  THUMBNAIL_INTERVALS: [0.1, 0.3, 0.5, 0.7, 0.9],
  TOKEN_EXPIRATION: 3600, // 1 hour
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  COMPRESSION_BITRATES: {
    '360p': 1000000, // 1 Mbps
    '720p': 2500000, // 2.5 Mbps
    '1080p': 5000000, // 5 Mbps
    '4k': 15000000, // 15 Mbps
  },
  AUDIO_BITRATE: 128000, // 128 kbps
  FRAME_RATES: [24, 30, 60],
  ASPECT_RATIOS: {
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1024, height: 768 },
    '1:1': { width: 1080, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
  },
  WATERMARK_POSITIONS: {
    'top-left': { x: 20, y: 20 },
    'top-right': { x: -20, y: 20 },
    'bottom-left': { x: 20, y: -20 },
    'bottom-right': { x: -20, y: -20 },
    'center': { x: 0, y: 0 },
  },
  PLAYBACK_RATES: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
  SEEK_STEP: 10, // seconds
  VOLUME_STEP: 0.1,
  BUFFER_SIZE: 30, // seconds
  ANALYTICS_BATCH_SIZE: 100,
  ANALYTICS_FLUSH_INTERVAL: 30000, // 30 seconds
  CACHE_TTL: 3600, // 1 hour
  CDN_CACHE_TTL: 86400, // 24 hours
  UPLOAD_TIMEOUT: 300000, // 5 minutes
  PROCESSING_TIMEOUT: 1800000, // 30 minutes
  STREAMING_TIMEOUT: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
  MAX_CONCURRENT_UPLOADS: 3,
  MAX_CONCURRENT_STREAMS: 100,
  MAX_BANDWIDTH: 50000000, // 50 Mbps
  MIN_BANDWIDTH: 500000, // 500 kbps
  QUALITY_SWITCH_THRESHOLD: 0.8,
  BUFFER_HEALTH_THRESHOLD: 10, // seconds
  ERROR_RETRY_LIMIT: 3,
  SESSION_TIMEOUT: 3600000, // 1 hour
  IDLE_TIMEOUT: 300000, // 5 minutes
  MAX_COMMENT_LENGTH: 1000,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TAGS: 20,
  MAX_TAG_LENGTH: 50,
  MAX_CHAPTERS: 100,
  MAX_CHAPTER_TITLE_LENGTH: 100,
  MAX_PLAYLIST_SIZE: 1000,
  MAX_WORKSPACE_MEMBERS: 100,
  MAX_FOLDERS_DEPTH: 10,
  MAX_SEARCH_RESULTS: 100,
  SEARCH_DEBOUNCE: 300, // milliseconds
  PAGINATION_LIMIT: 20,
  MAX_EXPORT_SIZE: 1000000000, // 1GB
  EXPORT_TIMEOUT: 1800000, // 30 minutes
  BACKUP_RETENTION: 30, // days
  LOG_RETENTION: 90, // days
  METRICS_RETENTION: 365, // days
  AUDIT_RETENTION: 2555, // 7 years
} as const;

// Enums
export enum VideoEventType {
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETED = 'upload_completed',
  UPLOAD_FAILED = 'upload_failed',
  PROCESSING_STARTED = 'processing_started',
  PROCESSING_PROGRESS = 'processing_progress',
  PROCESSING_COMPLETED = 'processing_completed',
  PROCESSING_FAILED = 'processing_failed',
  PLAYBACK_STARTED = 'playback_started',
  PLAYBACK_PAUSED = 'playback_paused',
  PLAYBACK_RESUMED = 'playback_resumed',
  PLAYBACK_ENDED = 'playback_ended',
  PLAYBACK_SEEKED = 'playback_seeked',
  QUALITY_CHANGED = 'quality_changed',
  SPEED_CHANGED = 'speed_changed',
  VOLUME_CHANGED = 'volume_changed',
  FULLSCREEN_ENTERED = 'fullscreen_entered',
  FULLSCREEN_EXITED = 'fullscreen_exited',
  ERROR_OCCURRED = 'error_occurred',
  BUFFER_STARTED = 'buffer_started',
  BUFFER_ENDED = 'buffer_ended',
  METADATA_LOADED = 'metadata_loaded',
  THUMBNAIL_GENERATED = 'thumbnail_generated',
  SUBTITLE_LOADED = 'subtitle_loaded',
  CHAPTER_CHANGED = 'chapter_changed',
  COMMENT_ADDED = 'comment_added',
  LIKE_ADDED = 'like_added',
  SHARE_CLICKED = 'share_clicked',
  DOWNLOAD_STARTED = 'download_started',
  ANALYTICS_TRACKED = 'analytics_tracked',
}

export enum VideoPermission {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  DOWNLOAD = 'download',
  COMMENT = 'comment',
  MODERATE = 'moderate',
  ADMIN = 'admin',
  UPLOAD = 'upload',
  MANAGE_USERS = 'manage_users',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  MANAGE_BILLING = 'manage_billing',
}

export enum VideoQuality {
  AUTO = 'auto',
  LOW = '360p',
  MEDIUM = '720p',
  HIGH = '1080p',
  ULTRA = '4k',
}

export enum VideoState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  ENDED = 'ended',
  ERROR = 'error',
}

export enum VideoErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DECODE_ERROR = 'DECODE_ERROR',
  SRC_NOT_SUPPORTED = 'SRC_NOT_SUPPORTED',
  ABORTED = 'ABORTED',
  UNKNOWN = 'UNKNOWN',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  MAINTENANCE = 'MAINTENANCE',
  DEPRECATED = 'DEPRECATED',
}

export enum VideoLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum VideoNotificationType {
  UPLOAD_COMPLETE = 'upload_complete',
  PROCESSING_COMPLETE = 'processing_complete',
  COMMENT_RECEIVED = 'comment_received',
  LIKE_RECEIVED = 'like_received',
  SHARE_RECEIVED = 'share_received',
  MENTION_RECEIVED = 'mention_received',
  SYSTEM_ALERT = 'system_alert',
  QUOTA_WARNING = 'quota_warning',
  SECURITY_ALERT = 'security_alert',
  MAINTENANCE_NOTICE = 'maintenance_notice',
}

export enum VideoIntegrationType {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  TWITCH = 'twitch',
  DISCORD = 'discord',
  SLACK = 'slack',
  TEAMS = 'teams',
  ZOOM = 'zoom',
  WEBEX = 'webex',
}

export enum VideoExportFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi',
  MOV = 'mov',
  MKV = 'mkv',
  FLV = 'flv',
  WMV = 'wmv',
  M4V = 'm4v',
  THREEGP = '3gp',
  OGV = 'ogv',
}

export enum VideoCompressionLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

export enum VideoStreamingProtocol {
  HLS = 'hls',
  DASH = 'dash',
  RTMP = 'rtmp',
  WEBRTC = 'webrtc',
  HTTP = 'http',
}

export enum VideoCodec {
  H264 = 'h264',
  H265 = 'h265',
  VP8 = 'vp8',
  VP9 = 'vp9',
  AV1 = 'av1',
  MPEG4 = 'mpeg4',
}

export enum AudioCodec {
  AAC = 'aac',
  MP3 = 'mp3',
  OPUS = 'opus',
  VORBIS = 'vorbis',
  FLAC = 'flac',
  WAV = 'wav',
}

export enum VideoContainer {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi',
  MOV = 'mov',
  MKV = 'mkv',
  FLV = 'flv',
  OGV = 'ogv',
}

export enum VideoOrientation {
  LANDSCAPE = 'landscape',
  PORTRAIT = 'portrait',
  SQUARE = 'square',
}

export enum VideoAspectRatio {
  SIXTEEN_NINE = '16:9',
  FOUR_THREE = '4:3',
  ONE_ONE = '1:1',
  NINE_SIXTEEN = '9:16',
  TWENTY_ONE_NINE = '21:9',
}

export enum VideoFrameRate {
  TWENTY_FOUR = 24,
  TWENTY_FIVE = 25,
  THIRTY = 30,
  FIFTY = 50,
  SIXTY = 60,
  ONE_TWENTY = 120,
}

export enum VideoColorSpace {
  REC709 = 'rec709',
  REC2020 = 'rec2020',
  SRGB = 'srgb',
  ADOBE_RGB = 'adobe_rgb',
  DCI_P3 = 'dci_p3',
}

export enum VideoHDR {
  NONE = 'none',
  HDR10 = 'hdr10',
  HDR10_PLUS = 'hdr10_plus',
  DOLBY_VISION = 'dolby_vision',
  HLG = 'hlg',
}

export enum VideoStereoMode {
  MONO = 'mono',
  STEREO_LEFT_RIGHT = 'stereo_lr',
  STEREO_TOP_BOTTOM = 'stereo_tb',
  VR_180 = 'vr_180',
  VR_360 = 'vr_360',
}

export enum VideoProjection {
  RECTANGULAR = 'rectangular',
  EQUIRECTANGULAR = 'equirectangular',
  CUBEMAP = 'cubemap',
  MESH = 'mesh',
}

export enum VideoViewingMode {
  NORMAL = 'normal',
  VR = 'vr',
  AR = 'ar',
  FULLSCREEN = 'fullscreen',
  PICTURE_IN_PICTURE = 'pip',
  THEATER = 'theater',
}

export enum VideoInteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  ROTATE = 'rotate',
  VOICE = 'voice',
  GESTURE = 'gesture',
}

export enum VideoDeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  TV = 'tv',
  VR_HEADSET = 'vr_headset',
  SMART_WATCH = 'smart_watch',
  GAME_CONSOLE = 'game_console',
}

export enum VideoBrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
  OPERA = 'opera',
  IE = 'ie',
  SAMSUNG = 'samsung',
  UC = 'uc',
}

export enum VideoOperatingSystem {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  ANDROID = 'android',
  IOS = 'ios',
  CHROME_OS = 'chrome_os',
  UBUNTU = 'ubuntu',
  FEDORA = 'fedora',
}

export enum VideoNetworkType {
  WIFI = 'wifi',
  CELLULAR_4G = '4g',
  CELLULAR_5G = '5g',
  ETHERNET = 'ethernet',
  BLUETOOTH = 'bluetooth',
  SATELLITE = 'satellite',
  DIAL_UP = 'dial_up',
}

export enum VideoConnectionSpeed {
  SLOW = 'slow',
  MEDIUM = 'medium',
  FAST = 'fast',
  VERY_FAST = 'very_fast',
}

export enum VideoRegion {
  NORTH_AMERICA = 'north_america',
  SOUTH_AMERICA = 'south_america',
  EUROPE = 'europe',
  ASIA = 'asia',
  AFRICA = 'africa',
  OCEANIA = 'oceania',
  ANTARCTICA = 'antarctica',
}

export enum VideoLanguage {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  PORTUGUESE = 'pt',
  RUSSIAN = 'ru',
  CHINESE = 'zh',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  ARABIC = 'ar',
  HINDI = 'hi',
}

export enum VideoTimezone {
  UTC = 'UTC',
  EST = 'America/New_York',
  PST = 'America/Los_Angeles',
  GMT = 'Europe/London',
  CET = 'Europe/Paris',
  JST = 'Asia/Tokyo',
  IST = 'Asia/Kolkata',
  CST = 'Asia/Shanghai',
  AEST = 'Australia/Sydney',
  BRT = 'America/Sao_Paulo',
}

export enum VideoCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR',
  BRL = 'BRL',
  CAD = 'CAD',
  AUD = 'AUD',
  KRW = 'KRW',
}

export enum VideoPaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTOCURRENCY = 'cryptocurrency',
}

export enum VideoSubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export enum VideoStorageProvider {
  LOCAL = 'local',
  AWS_S3 = 'aws_s3',
  GOOGLE_CLOUD = 'google_cloud',
  AZURE_BLOB = 'azure_blob',
  CLOUDFLARE_R2 = 'cloudflare_r2',
  DIGITAL_OCEAN = 'digital_ocean',
  BACKBLAZE_B2 = 'backblaze_b2',
}

export enum VideoProcessingStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  SCHEDULED = 'scheduled',
  DRAFT = 'draft',
}

export enum VideoModerationStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  UNDER_REVIEW = 'under_review',
}

export enum VideoContentType {
  EDUCATIONAL = 'educational',
  ENTERTAINMENT = 'entertainment',
  COMMERCIAL = 'commercial',
  DOCUMENTARY = 'documentary',
  TUTORIAL = 'tutorial',
  PRESENTATION = 'presentation',
  WEBINAR = 'webinar',
  LIVE_STREAM = 'live_stream',
}

export enum VideoAgeRating {
  ALL_AGES = 'all_ages',
  TEEN = 'teen',
  MATURE = 'mature',
  ADULT = 'adult',
}

export enum VideoLicenseType {
  STANDARD = 'standard',
  CREATIVE_COMMONS = 'creative_commons',
  ROYALTY_FREE = 'royalty_free',
  RIGHTS_MANAGED = 'rights_managed',
  EDITORIAL = 'editorial',
}

export enum VideoTranscodingProfile {
  WEB_OPTIMIZED = 'web_optimized',
  MOBILE_OPTIMIZED = 'mobile_optimized',
  HIGH_QUALITY = 'high_quality',
  FAST_ENCODING = 'fast_encoding',
  SMALL_FILE_SIZE = 'small_file_size',
}

export enum VideoDeliveryMethod {
  PROGRESSIVE = 'progressive',
  ADAPTIVE_STREAMING = 'adaptive_streaming',
  LIVE_STREAMING = 'live_streaming',
  DOWNLOAD = 'download',
}

export enum VideoAnalyticsMetric {
  VIEWS = 'views',
  UNIQUE_VIEWS = 'unique_views',
  WATCH_TIME = 'watch_time',
  ENGAGEMENT = 'engagement',
  COMPLETION_RATE = 'completion_rate',
  CLICK_THROUGH_RATE = 'click_through_rate',
  CONVERSION_RATE = 'conversion_rate',
}

export enum VideoPlayerTheme {
  DEFAULT = 'default',
  DARK = 'dark',
  LIGHT = 'light',
  MINIMAL = 'minimal',
  BRANDED = 'branded',
  CUSTOM = 'custom',
}

export enum VideoPlayerSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  RESPONSIVE = 'responsive',
  FULLSCREEN = 'fullscreen',
}

export enum VideoThumbnailType {
  AUTO_GENERATED = 'auto_generated',
  CUSTOM_UPLOAD = 'custom_upload',
  FRAME_CAPTURE = 'frame_capture',
  AI_GENERATED = 'ai_generated',
}

export enum VideoWatermarkType {
  TEXT = 'text',
  IMAGE = 'image',
  LOGO = 'logo',
  DYNAMIC = 'dynamic',
}

export enum VideoSecurityLevel {
  NONE = 'none',
  BASIC = 'basic',
  STANDARD = 'standard',
  HIGH = 'high',
  MAXIMUM = 'maximum',
}

export enum VideoBackupFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum VideoCompressionAlgorithm {
  H264 = 'h264',
  H265 = 'h265',
  VP9 = 'vp9',
  AV1 = 'av1',
  CUSTOM = 'custom',
}

export enum VideoStreamingQuality {
  AUTO = 'auto',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
  SOURCE = 'source',
}

export enum VideoPlayerControl {
  PLAY_PAUSE = 'play_pause',
  VOLUME = 'volume',
  PROGRESS = 'progress',
  FULLSCREEN = 'fullscreen',
  QUALITY = 'quality',
  SPEED = 'speed',
  CAPTIONS = 'captions',
  CHAPTERS = 'chapters',
}

export enum VideoEventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum VideoProcessingPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum VideoUploadMethod {
  DIRECT = 'direct',
  CHUNKED = 'chunked',
  RESUMABLE = 'resumable',
  MULTIPART = 'multipart',
}

export enum VideoDownloadFormat {
  ORIGINAL = 'original',
  MP4_720P = 'mp4_720p',
  MP4_1080P = 'mp4_1080p',
  WEBM = 'webm',
  AUDIO_ONLY = 'audio_only',
}

export enum VideoSearchSortBy {
  RELEVANCE = 'relevance',
  DATE = 'date',
  VIEWS = 'views',
  DURATION = 'duration',
  TITLE = 'title',
  RATING = 'rating',
}

export enum VideoSearchOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum VideoReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  COPYRIGHT = 'copyright',
  HARASSMENT = 'harassment',
  VIOLENCE = 'violence',
  HATE_SPEECH = 'hate_speech',
  MISINFORMATION = 'misinformation',
}

export enum VideoNotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never',
}

export enum VideoExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum VideoImportStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum VideoSyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
  CONFLICT = 'conflict',
  DISABLED = 'disabled',
}

export enum VideoWorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error',
}

export enum VideoTemplateCategory {
  BUSINESS = 'business',
  EDUCATION = 'education',
  MARKETING = 'marketing',
  SOCIAL_MEDIA = 'social_media',
  PRESENTATION = 'presentation',
  TUTORIAL = 'tutorial',
}

export enum VideoEditorTool {
  CUT = 'cut',
  TRIM = 'trim',
  SPLIT = 'split',
  MERGE = 'merge',
  CROP = 'crop',
  ROTATE = 'rotate',
  FILTER = 'filter',
  TRANSITION = 'transition',
}

export enum VideoConferenceRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  PRESENTER = 'presenter',
  ATTENDEE = 'attendee',
  OBSERVER = 'observer',
}

export enum VideoGameAchievementType {
  WATCH_TIME = 'watch_time',
  COMPLETION = 'completion',
  QUIZ_SCORE = 'quiz_score',
  STREAK = 'streak',
  ENGAGEMENT = 'engagement',
  SOCIAL = 'social',
}

export enum VideoAccessibilityFeature {
  CLOSED_CAPTIONS = 'closed_captions',
  AUDIO_DESCRIPTION = 'audio_description',
  SIGN_LANGUAGE = 'sign_language',
  HIGH_CONTRAST = 'high_contrast',
  KEYBOARD_NAVIGATION = 'keyboard_navigation',
  SCREEN_READER = 'screen_reader',
}

export enum VideoMonetizationModel {
  FREE = 'free',
  FREEMIUM = 'freemium',
  SUBSCRIPTION = 'subscription',
  PAY_PER_VIEW = 'pay_per_view',
  ADVERTISING = 'advertising',
  SPONSORSHIP = 'sponsorship',
}

export enum VideoComplianceStandard {
  GDPR = 'gdpr',
  COPPA = 'coppa',
  CCPA = 'ccpa',
  HIPAA = 'hipaa',
  SOX = 'sox',
  PCI_DSS = 'pci_dss',
}

export enum VideoMigrationType {
  PLATFORM = 'platform',
  STORAGE = 'storage',
  FORMAT = 'format',
  QUALITY = 'quality',
  METADATA = 'metadata',
}

export enum VideoAuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SHARE = 'share',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
}

export enum VideoHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

export enum VideoCacheType {
  METADATA = 'metadata',
  THUMBNAIL = 'thumbnail',
  PREVIEW = 'preview',
  CHUNK = 'chunk',
  MANIFEST = 'manifest',
}

export enum VideoQueuePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum VideoEventSource {
  PLAYER = 'player',
  API = 'api',
  SYSTEM = 'system',
  USER = 'user',
  WEBHOOK = 'webhook',
}

export enum VideoFeatureFlagStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  TESTING = 'testing',
  DEPRECATED = 'deprecated',
}

export enum VideoExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VideoPersonalizationLevel {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  AI_POWERED = 'ai_powered',
}

export enum VideoSecurityThreat {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  MALWARE = 'malware',
  DDOS = 'ddos',
  FRAUD = 'fraud',
}

export enum VideoEnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

export enum VideoSDKPlatform {
  WEB = 'web',
  IOS = 'ios',
  ANDROID = 'android',
  REACT_NATIVE = 'react_native',
  FLUTTER = 'flutter',
  UNITY = 'unity',
}

export enum VideoPluginStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  UPDATING = 'updating',
}

export enum VideoThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  CUSTOM = 'custom',
}

export enum VideoLocalizationStatus {
  ORIGINAL = 'original',
  TRANSLATED = 'translated',
  PENDING = 'pending',
  REVIEWING = 'reviewing',
}

export enum VideoTestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
}

export enum VideoDocumentationType {
  API = 'api',
  USER_GUIDE = 'user_guide',
  DEVELOPER = 'developer',
  CHANGELOG = 'changelog',
  FAQ = 'faq',
}

export enum VideoLicensePermission {
  VIEW = 'view',
  DOWNLOAD = 'download',
  MODIFY = 'modify',
  REDISTRIBUTE = 'redistribute',
  COMMERCIAL_USE = 'commercial_use',
}

export enum VideoOptimizationType {
  TITLE = 'title',
  DESCRIPTION = 'description',
  THUMBNAIL = 'thumbnail',
  TAGS = 'tags',
  TIMING = 'timing',
  QUALITY = 'quality',
}

export enum VideoWorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export enum VideoAPIAuthType {
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  JWT = 'jwt',
  BASIC = 'basic',
  BEARER = 'bearer',
}

export enum VideoErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum VideoErrorCategory {
  UPLOAD = 'upload',
  PLAYBACK = 'playback',
  PROCESSING = 'processing',
  NETWORK = 'network',
  AUTH = 'auth',
  SYSTEM = 'system',
}

// Helper functions
export const isValidVideoFormat = (format: string): format is VideoFormat => {
  return VIDEO_CONSTANTS.SUPPORTED_FORMATS.includes(format as VideoFormat);
};

export const isValidVideoResolution = (resolution: string): resolution is VideoResolution => {
  return VIDEO_CONSTANTS.DEFAULT_QUALITIES.includes(resolution as VideoResolution);
};

export const getVideoBitrate = (resolution: VideoResolution): number => {
  return VIDEO_CONSTANTS.COMPRESSION_BITRATES[resolution] || 0;
};

export const formatVideoSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

export const formatVideoDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const calculateVideoProgress = (currentTime: number, duration: number): number => {
  if (duration === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
};

export const generateVideoId = (): string => {
  return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUploadToken = (videoId: string, userId: string): string => {
  const payload = { videoId, userId, timestamp: Date.now() };
  return btoa(JSON.stringify(payload));
};

export const validateVideoMetadata = (metadata: Partial<VideoMetadata>): string[] => {
  const errors: string[] = [];
  
  if (!metadata.title || metadata.title.length > VIDEO_CONSTANTS.MAX_TITLE_LENGTH) {
    errors.push(`Title must be between 1 and ${VIDEO_CONSTANTS.MAX_TITLE_LENGTH} characters`);
  }
  
  if (metadata.description && metadata.description.length > VIDEO_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description must be less than ${VIDEO_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`);
  }
  
  if (metadata.size && metadata.size > VIDEO_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${formatVideoSize(VIDEO_CONSTANTS.MAX_FILE_SIZE)}`);
  }
  
  return errors;
};

export const getVideoQualityFromResolution = (resolution: VideoResolution): VideoQuality => {
  switch (resolution) {
    case '360p': return VideoQuality.LOW;
    case '720p': return VideoQuality.MEDIUM;
    case '1080p': return VideoQuality.HIGH;
    case '4k': return VideoQuality.ULTRA;
    default: return VideoQuality.AUTO;
  }
};

export const getResolutionFromQuality = (quality: VideoQuality): VideoResolution => {
  switch (quality) {
    case VideoQuality.LOW: return '360p';
    case VideoQuality.MEDIUM: return '720p';
    case VideoQuality.HIGH: return '1080p';
    case VideoQuality.ULTRA: return '4k';
    default: return '720p';
  }
};

export const createVideoError = (
  code: VideoErrorCode,
  message: string,
  details?: unknown
): VideoError => {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    severity: 'medium',
    category: 'system',
    isRetryable: false,
  };
};

export const createVideoSuccess = (
  message: string,
  data?: unknown,
  requestId?: string
): VideoSuccess => {
  return {
    message,
    data,
    timestamp: new Date(),
    requestId: requestId || generateVideoId(),
    duration: 0,
    cached: false,
    version: '1.0.0',
  };
};

// Type guards
export const isVideoMetadata = (obj: unknown): obj is VideoMetadata => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
};

export const isVideoError = (obj: unknown): obj is VideoError => {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string';
};

export const isVideoUploadProgress = (obj: unknown): obj is UploadProgress => {
  return obj && typeof obj.loaded === 'number' && typeof obj.total === 'number';
};

export const isVideoStreamingUrls = (obj: unknown): obj is VideoStreamingUrls => {
  return obj && typeof obj['720p'] === 'string' && typeof obj.thumbnail === 'string';
};

// Default configurations
export const DEFAULT_VIDEO_CONFIG: VideoUploadConfig = {
  maxFileSize: VIDEO_CONSTANTS.MAX_FILE_SIZE,
  supportedFormats: VIDEO_CONSTANTS.SUPPORTED_FORMATS,
  chunkSize: VIDEO_CONSTANTS.CHUNK_SIZE,
  compressionQualities: VIDEO_CONSTANTS.DEFAULT_QUALITIES,
  watermarkConfig: {
    text: 'Solara Nova Energia',
    position: 'bottom-right',
    opacity: 0.7,
    fontSize: 16,
    color: '#ffffff',
  },
};

export const DEFAULT_PLAYER_CONFIG: VideoPlayerConfig = {
  autoPlay: false,
  showControls: true,
  enableDownload: false,
  enableFullscreen: true,
  enablePictureInPicture: true,
  playbackRates: VIDEO_CONSTANTS.PLAYBACK_RATES,
  defaultQuality: '720p',
  watermark: DEFAULT_VIDEO_CONFIG.watermarkConfig,
  analytics: true,
};

export const DEFAULT_SECURITY_CONFIG: VideoSecurityConfig = {
  tokenExpiration: VIDEO_CONSTANTS.TOKEN_EXPIRATION,
  domainRestriction: [],
  downloadProtection: true,
  watermarkEnabled: true,
  viewTracking: true,
};

export const DEFAULT_COMPRESSION_CONFIG: VideoCompressionConfig = {
  qualities: VIDEO_CONSTANTS.DEFAULT_QUALITIES,
  codec: 'h264',
  bitrates: VIDEO_CONSTANTS.COMPRESSION_BITRATES,
  audioCodec: 'aac',
  audioBitrate: VIDEO_CONSTANTS.AUDIO_BITRATE,
};

export const DEFAULT_THUMBNAIL_CONFIG: VideoThumbnailConfig = {
  count: VIDEO_CONSTANTS.THUMBNAIL_COUNT,
  intervals: VIDEO_CONSTANTS.THUMBNAIL_INTERVALS,
  width: 1280,
  height: 720,
  quality: 0.8,
  format: 'jpeg',
};

// Export all types for convenience
export type {
  VideoMetadata,
  VideoChapter,
  UploadProgress,
  VideoUploadConfig,
  WatermarkConfig,
  VideoProgress,
  TimeRange,
  VideoAnalytics,
  VideoSecurityConfig,
  VideoStreamingUrls,
  VideoUploadResult,
  VideoPlayerConfig,
  VideoComment,
  VideoNote,
  VideoQuiz,
  VideoInteraction,
  VideoProcessingJob,
  VideoStorageInfo,
  VideoAccessLog,
  VideoPlaylist,
  VideoTranscript,
  TranscriptSegment,
  VideoSubtitle,
  VideoThumbnailConfig,
  VideoCompressionConfig,
  VideoSearchFilters,
  VideoSearchResult,
  VideoRecommendation,
  VideoEngagementMetrics,
  VideoLearningPath,
  VideoCompletionCertificate,
  VideoStreamingStats,
  VideoModerationFlag,
  VideoBackupConfig,
  VideoAPIResponse,
  VideoUploadChunk,
  VideoUploadSession,
  VideoQualityMetrics,
  VideoContentAnalysis,
  VideoPerformanceMetrics,
  VideoAccessControl,
  VideoVersioning,
  VideoCollaboration,
  VideoAIInsights,
  VideoExportOptions,
  VideoImportOptions,
  VideoScheduling,
  VideoLiveStream,
  VideoChat,
  VideoNotification,
  VideoSubscription,
  VideoChannel,
  VideoPlaybackSession,
  VideoReporting,
  VideoIntegration,
  VideoWorkflow,
  VideoTemplate,
  VideoEditor,
  VideoConference,
  VideoGameification,
  VideoAccessibility,
  VideoMonetization,
  VideoCompliance,
  VideoMigration,
  VideoAudit,
  VideoHealth,
  VideoCache,
  VideoQueue,
  VideoEvent,
  VideoFeatureFlag,
  VideoExperiment,
  VideoPersonalization,
  VideoSecurity,
  VideoEnvironment,
  VideoSDK,
  VideoPlugin,
  VideoTheme,
  VideoLocalization,
  VideoTesting,
  VideoDocumentation,
  VideoLicense,
  VideoMetrics,
  VideoOptimization,
  VideoWorkspace,
  VideoAPI,
  VideoError,
  VideoSuccess,
};

// Export all enums for convenience
export {
  VideoEventType,
  VideoPermission,
  VideoQuality,
  VideoState,
  VideoErrorCode,
  VideoLogLevel,
  VideoNotificationType,
  VideoIntegrationType,
  VideoExportFormat,
  VideoCompressionLevel,
  VideoStreamingProtocol,
  VideoCodec,
  AudioCodec,
  VideoContainer,
  VideoOrientation,
  VideoAspectRatio,
  VideoFrameRate,
  VideoColorSpace,
  VideoHDR,
  VideoStereoMode,
  VideoProjection,
  VideoViewingMode,
  VideoInteractionType,
  VideoDeviceType,
  VideoBrowserType,
  VideoOperatingSystem,
  VideoNetworkType,
  VideoConnectionSpeed,
  VideoRegion,
  VideoLanguage,
  VideoTimezone,
  VideoCurrency,
  VideoPaymentMethod,
  VideoSubscriptionPlan,
  VideoStorageProvider,
  VideoProcessingStatus,
  VideoVisibility,
  VideoModerationStatus,
  VideoContentType,
  VideoAgeRating,
  VideoLicenseType,
  VideoTranscodingProfile,
  VideoDeliveryMethod,
  VideoAnalyticsMetric,
  VideoPlayerTheme,
  VideoPlayerSize,
  VideoThumbnailType,
  VideoWatermarkType,
  VideoSecurityLevel,
  VideoBackupFrequency,
  VideoCompressionAlgorithm,
  VideoStreamingQuality,
  VideoPlayerControl,
  VideoEventPriority,
  VideoProcessingPriority,
  VideoUploadMethod,
  VideoDownloadFormat,
  VideoSearchSortBy,
  VideoSearchOrder,
  VideoReportType,
  VideoNotificationFrequency,
  VideoExportStatus,
  VideoImportStatus,
  VideoSyncStatus,
  VideoWorkflowStatus,
  VideoTemplateCategory,
  VideoEditorTool,
  VideoConferenceRole,
  VideoGameAchievementType,
  VideoAccessibilityFeature,
  VideoMonetizationModel,
  VideoComplianceStandard,
  VideoMigrationType,
  VideoAuditAction,
  VideoHealthStatus,
  VideoCacheType,
  VideoQueuePriority,
  VideoEventSource,
  VideoFeatureFlagStatus,
  VideoExperimentStatus,
  VideoPersonalizationLevel,
  VideoSecurityThreat,
  VideoEnvironmentType,
  VideoSDKPlatform,
  VideoPluginStatus,
  VideoThemeType,
  VideoLocalizationStatus,
  VideoTestType,
  VideoDocumentationType,
  VideoLicensePermission,
  VideoOptimizationType,
  VideoWorkspaceRole,
  VideoAPIAuthType,
  VideoErrorSeverity,
  VideoErrorCategory,
};
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import { 
  Globe, 
  Twitter, 
  Facebook, 
  Linkedin,
  Plus, 
  Calendar, 
  BarChart3, 
  Settings, 
  Send, 
  Clock, 
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  RefreshCw,
  ExternalLink,
  FileText,
  Repeat2,
  Newspaper,
  Sparkles,
  Trash2,
  Edit3,
  ArrowRight,
  BookOpen,
  Megaphone
} from 'lucide-react';
import type { PRArticle } from '../types';

// ---- Types ----

type TabType = 'dashboard' | 'compose' | 'pr-hub' | 'content-bridge' | 'calendar' | 'settings';
type PlatformType = 'linkedin' | 'x' | 'facebook';

interface SocialAccount {
  id: string;
  platform: PlatformType;
  handle: string;
  name: string;
  connected: boolean;
  lastSync?: string;
}

interface SocialPost {
  id: string;
  platforms: PlatformType[];
  content: string;
  mediaUrls: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  publishedAt?: string;
  sourceContentAssetId?: string;
  rewriteType?: 'manual' | 'ai-from-asset';
  metrics?: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
  };
}

// ---- Mock Data ----

const mockAccounts: SocialAccount[] = [
  { id: 'acc_1', platform: 'x', handle: '@tdpaintcell', name: 'TD Paint Cell', connected: true, lastSync: '2024-01-15 10:30' },
  { id: 'acc_2', platform: 'facebook', handle: 'TDPaintCell', name: 'TD Paint Cell Official', connected: false },
  { id: 'acc_3', platform: 'linkedin', handle: 'td-paint-cell', name: 'TD Paint Cell (LinkedIn)', connected: false },
];

const mockPosts: SocialPost[] = [
  {
    id: 'post_1',
    platforms: ['x'],
    content: 'Introducing our latest automated paint cell technology - achieving 30% reduction in VOC emissions while maintaining \u00b10.1mm precision. #IndustrialAutomation #Sustainability',
    mediaUrls: [],
    status: 'published',
    publishedAt: '2024-01-14 14:00',
    metrics: { impressions: 1250, likes: 45, comments: 8, shares: 12 }
  },
  {
    id: 'post_2',
    platforms: ['x', 'facebook'],
    content: 'Join us at Hannover Messe 2024! Visit booth H12-B45 to see our robotic paint solutions in action.',
    mediaUrls: [],
    status: 'scheduled',
    scheduledFor: '2024-04-22 09:00'
  },
  {
    id: 'post_3',
    platforms: ['facebook'],
    content: 'Case study: How automotive supplier ABC Corp reduced paint shop labor costs by 40% with our Easy-Start robotic cells.',
    mediaUrls: [],
    status: 'draft'
  }
];

const mockPRArticles: PRArticle[] = [
  {
    id: 'pr_1',
    title: 'TD Paint Cell Launches Next-Gen Robotic Spray Coating Workstation for Automotive Industry',
    subtitle: 'New system delivers 30% VOC reduction with industry-leading precision',
    body: 'Shanghai, China \u2014 TD Paint Cell, a leading provider of automated painting solutions, today announced the launch of its next-generation robotic spray coating workstation...',
    category: 'news-release',
    status: 'approved',
    distributions: [{ platform: 'PR Newswire', distributedAt: '2024-01-10', status: 'published' }],
    keywords: ['robotic painting', 'VOC reduction', 'automotive'],
    aboutCompany: 'TD Paint Cell is a Shanghai-based manufacturer of robotic spray coating workstations.',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-10'
  },
  {
    id: 'pr_2',
    title: 'Industrial Automation Trends 2024: How Smart Paint Cells Are Reshaping Manufacturing',
    body: 'The global industrial automation market is projected to reach $395 billion by 2029...',
    category: 'industry-article',
    status: 'draft',
    distributions: [],
    keywords: ['industrial automation', 'smart manufacturing'],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-12'
  }
];

// ---- Component ----

const SocialPresence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [accounts, setAccounts] = useState<SocialAccount[]>(mockAccounts);
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [prArticles, setPrArticles] = useState<PRArticle[]>(mockPRArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const toast = useToast();

  // Compose state
  const [composeContent, setComposeContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['x']);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isPublishNow, setIsPublishNow] = useState(true);

  // PR Hub state
  const [prEditing, setPrEditing] = useState<PRArticle | null>(null);
  const [prTitle, setPrTitle] = useState('');
  const [prSubtitle, setPrSubtitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [prCategory, setPrCategory] = useState<PRArticle['category']>('news-release');
  const [prKeywords, setPrKeywords] = useState('');

  // Content Bridge state
  const [bridgeSourceText, setBridgeSourceText] = useState('');
  const [bridgeTargetFormat, setBridgeTargetFormat] = useState<'social-post' | 'pr-article'>('social-post');
  const [bridgePlatform, setBridgePlatform] = useState<PlatformType>('linkedin');
  const [bridgeResult, setBridgeResult] = useState<{ rewritten: string; hashtags: string[]; cta: string } | null>(null);
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    const controller = new AbortController();
    setIsFetchingPosts(true);
    fetch('/api/social/posts', { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: SocialPost[]) => { if (data.length > 0) setPosts(data); })
      .catch(err => { if (err.name !== 'AbortError') console.warn('Social posts API not available, using mock data'); })
      .finally(() => setIsFetchingPosts(false));

    fetch('/api/pr/articles', { signal: controller.signal })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: PRArticle[]) => { if (data.length > 0) setPrArticles(data); })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  // ---- Tabs ----

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '\u6982\u89c8', icon: <Globe size={16} /> },
    { id: 'compose', label: '\u793e\u4ea4\u53d1\u5e03', icon: <Send size={16} /> },
    { id: 'pr-hub', label: 'PR\u4e2d\u67a2', icon: <Newspaper size={16} /> },
    { id: 'content-bridge', label: '\u5185\u5bb9\u6865\u63a5', icon: <Repeat2 size={16} /> },
    { id: 'calendar', label: '\u6392\u7a0b', icon: <Calendar size={16} /> },
    { id: 'settings', label: '\u8bbe\u7f6e', icon: <Settings size={16} /> },
  ];

  // ---- Handlers ----

  const handleConnectAccount = async (platform: PlatformType) => {
    if (platform === 'linkedin') {
      toast.info('\u6b63\u5728\u8fde\u63a5', '\u6b63\u5728\u5c1d\u8bd5\u8fde\u63a5 LinkedIn \u8d26\u53f7...');
      try {
        const res = await fetch('/api/auth/linkedin/authorize');
        const data = await res.json();
        if (data.mock) {
          toast.warning('Mock \u6a21\u5f0f', 'LinkedIn OAuth \u5f53\u524d\u4e3a\u6a21\u62df\u6a21\u5f0f\uff0c\u8bbe\u7f6e LINKEDIN_CLIENT_ID \u542f\u7528\u771f\u5b9e OAuth');
          // Simulate connecting
          setAccounts(prev => prev.map(a => a.platform === 'linkedin' ? { ...a, connected: true, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : a));
        } else if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } catch {
        toast.error('\u8fde\u63a5\u5931\u8d25', 'LinkedIn \u6388\u6743\u670d\u52a1\u4e0d\u53ef\u7528');
      }
      return;
    }
    const label = platform === 'x' ? 'X (Twitter)' : 'Facebook';
    toast.info('\u5373\u5c06\u8df3\u8f6c', `\u6b63\u5728\u8fde\u63a5 ${label} \u8d26\u53f7...`);
    setTimeout(() => {
      toast.warning('\u529f\u80fd\u5f00\u53d1\u4e2d', 'OAuth \u6388\u6743\u6d41\u7a0b\u6b63\u5728\u5f00\u53d1\u4e2d\uff0c\u656c\u8bf7\u671f\u5f85');
    }, 1500);
  };

  const handlePublish = async () => {
    if (!composeContent.trim()) { toast.error('\u5185\u5bb9\u4e0d\u80fd\u4e3a\u7a7a', '\u8bf7\u8f93\u5165\u8981\u53d1\u5e03\u7684\u5185\u5bb9'); return; }
    if (selectedPlatforms.length === 0) { toast.error('\u8bf7\u9009\u62e9\u5e73\u53f0', '\u81f3\u5c11\u9009\u62e9\u4e00\u4e2a\u53d1\u5e03\u5e73\u53f0'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: composeContent,
          platforms: selectedPlatforms,
          scheduledFor: !isPublishNow ? scheduleDate : undefined,
        })
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: '\u53d1\u5e03\u5931\u8d25' })); throw new Error(err.details || err.error || '\u53d1\u5e03\u5931\u8d25'); }
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setComposeContent('');
      toast.success(isPublishNow ? '\u53d1\u5e03\u6210\u529f' : '\u6392\u7a0b\u6210\u529f', isPublishNow ? `\u5185\u5bb9\u5df2\u53d1\u5e03\u5230 ${selectedPlatforms.join(', ')}` : `\u5185\u5bb9\u5df2\u6392\u7a0b\u4e8e ${scheduleDate}`);
      setActiveTab('dashboard');
    } catch (err: any) {
      toast.error('\u64cd\u4f5c\u5931\u8d25', err.message || '\u8bf7\u7a0d\u540e\u91cd\u8bd5');
    } finally { setIsLoading(false); }
  };

  // PR CRUD
  const handleSavePR = async () => {
    if (!prTitle.trim() || !prBody.trim()) { toast.error('\u5fc5\u586b\u5b57\u6bb5', '\u6807\u9898\u548c\u6b63\u6587\u4e0d\u80fd\u4e3a\u7a7a'); return; }
    setIsLoading(true);
    try {
      const payload = { title: prTitle, subtitle: prSubtitle, body: prBody, category: prCategory, keywords: prKeywords.split(',').map(k => k.trim()).filter(Boolean) };
      const url = prEditing ? `/api/pr/articles/${prEditing.id}` : '/api/pr/articles';
      const method = prEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed');
      const saved = await res.json();
      if (prEditing) {
        setPrArticles(prev => prev.map(a => a.id === saved.id ? saved : a));
        toast.success('\u66f4\u65b0\u6210\u529f', 'PR \u7a3f\u4ef6\u5df2\u66f4\u65b0');
      } else {
        setPrArticles(prev => [saved, ...prev]);
        toast.success('\u521b\u5efa\u6210\u529f', '\u65b0 PR \u7a3f\u4ef6\u5df2\u4fdd\u5b58');
      }
      resetPRForm();
    } catch {
      toast.error('\u4fdd\u5b58\u5931\u8d25', '\u8bf7\u7a0d\u540e\u91cd\u8bd5');
    } finally { setIsLoading(false); }
  };

  const handleDeletePR = async (id: string) => {
    try {
      await fetch(`/api/pr/articles/${id}`, { method: 'DELETE' });
      setPrArticles(prev => prev.filter(a => a.id !== id));
      toast.success('\u5df2\u5220\u9664', 'PR \u7a3f\u4ef6\u5df2\u5220\u9664');
    } catch {
      toast.error('\u5220\u9664\u5931\u8d25', '\u8bf7\u7a0d\u540e\u91cd\u8bd5');
    }
  };

  const startEditPR = (article: PRArticle) => {
    setPrEditing(article);
    setPrTitle(article.title);
    setPrSubtitle(article.subtitle || '');
    setPrBody(article.body);
    setPrCategory(article.category);
    setPrKeywords(article.keywords.join(', '));
  };

  const resetPRForm = () => {
    setPrEditing(null);
    setPrTitle('');
    setPrSubtitle('');
    setPrBody('');
    setPrCategory('news-release');
    setPrKeywords('');
  };

  // Content Bridge AI rewrite
  const handleRewrite = async () => {
    if (!bridgeSourceText.trim()) { toast.error('\u8bf7\u8f93\u5165\u6e90\u6587\u672c', '\u9700\u8981\u63d0\u4f9b\u8981\u6539\u5199\u7684\u5185\u5bb9'); return; }
    setIsBridgeLoading(true);
    setBridgeResult(null);
    try {
      if (bridgeTargetFormat === 'social-post') {
        const res = await fetch('/api/content/rewrite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceText: bridgeSourceText, targetFormat: 'social-post', platform: bridgePlatform })
        });
        if (!res.ok) throw new Error('Rewrite failed');
        const data = await res.json();
        setBridgeResult({ rewritten: data.rewritten, hashtags: data.hashtags || [], cta: data.cta || '' });
        toast.success('AI \u6539\u5199\u5b8c\u6210', `\u5df2\u751f\u6210 ${bridgePlatform} \u5e73\u53f0\u5185\u5bb9`);
      } else {
        const res = await fetch('/api/pr/generate-from-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetBody: bridgeSourceText, assetTitle: '', category: 'news-release' })
        });
        if (!res.ok) throw new Error('PR generation failed');
        const data = await res.json();
        setBridgeResult({ rewritten: `${data.title}\n\n${data.subtitle ? data.subtitle + '\n\n' : ''}${data.body}`, hashtags: data.keywords || [], cta: '' });
        setPrArticles(prev => [data, ...prev]);
        toast.success('PR \u7a3f\u4ef6\u5df2\u751f\u6210', '\u5df2\u81ea\u52a8\u4fdd\u5b58\u4e3a\u8349\u7a3f');
      }
    } catch {
      toast.error('AI \u751f\u6210\u5931\u8d25', '\u8bf7\u68c0\u67e5\u7f51\u7edc\u8fde\u63a5\u6216\u7a0d\u540e\u91cd\u8bd5');
    } finally { setIsBridgeLoading(false); }
  };

  const useBridgeResultAsPost = () => {
    if (!bridgeResult) return;
    setComposeContent(bridgeResult.rewritten + (bridgeResult.hashtags.length ? '\n\n' + bridgeResult.hashtags.map(t => `#${t}`).join(' ') : ''));
    setSelectedPlatforms([bridgePlatform]);
    setActiveTab('compose');
    toast.info('\u5df2\u5bfc\u5165', '\u6539\u5199\u5185\u5bb9\u5df2\u5bfc\u5165\u53d1\u5e03\u7f16\u8f91\u5668');
  };

  // ---- Helpers ----

  const getPlatformIcon = (platform: PlatformType, size = 16) => {
    if (platform === 'linkedin') return <Linkedin size={size} className="text-blue-700" />;
    if (platform === 'x') return <Twitter size={size} className="text-slate-700" />;
    return <Facebook size={size} className="text-blue-600" />;
  };

  const getPlatformLabel = (platform: PlatformType) => {
    if (platform === 'linkedin') return 'LinkedIn';
    if (platform === 'x') return 'X (Twitter)';
    return 'Facebook';
  };

  const getPlatformBg = (platform: PlatformType) => {
    if (platform === 'linkedin') return 'bg-blue-50';
    if (platform === 'x') return 'bg-slate-100';
    return 'bg-blue-50';
  };

  const getPlatformBtnColor = (platform: PlatformType) => {
    if (platform === 'linkedin') return 'bg-blue-700 hover:bg-blue-800';
    if (platform === 'x') return 'bg-slate-900 hover:bg-slate-800';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getStatusBadge = (status: SocialPost['status']) => {
    const styles: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', scheduled: 'bg-amber-50 text-amber-700', published: 'bg-emerald-50 text-emerald-700', failed: 'bg-red-50 text-red-700' };
    const labels: Record<string, string> = { draft: '\u8349\u7a3f', scheduled: '\u5df2\u6392\u7a0b', published: '\u5df2\u53d1\u5e03', failed: '\u53d1\u5e03\u5931\u8d25' };
    return <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${styles[status]}`}>{labels[status]}</span>;
  };

  const getPRStatusBadge = (status: PRArticle['status']) => {
    const styles: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', review: 'bg-amber-50 text-amber-700', approved: 'bg-blue-50 text-blue-700', distributed: 'bg-emerald-50 text-emerald-700' };
    const labels: Record<string, string> = { draft: '\u8349\u7a3f', review: '\u5ba1\u6838\u4e2d', approved: '\u5df2\u5ba1\u6279', distributed: '\u5df2\u5206\u53d1' };
    return <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${styles[status]}`}>{labels[status]}</span>;
  };

  const getCategoryLabel = (cat: PRArticle['category']) => {
    if (cat === 'news-release') return '\u65b0\u95fb\u901a\u7a3f';
    if (cat === 'industry-article') return '\u884c\u4e1a\u6587\u7ae0';
    return '\u5ba2\u6237\u6848\u4f8b';
  };

  // Stats
  const stats = {
    totalPosts: posts.filter(p => p.status === 'published').length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    totalImpressions: posts.reduce((acc, p) => acc + (p.metrics?.impressions || 0), 0),
    totalEngagement: posts.reduce((acc, p) => acc + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0), 0),
    prDrafts: prArticles.filter(a => a.status === 'draft').length,
    prDistributed: prArticles.filter(a => a.status === 'distributed').length,
    totalPR: prArticles.length,
  };

  // ---- Render ----

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3">
            <Globe size={28} className="text-gold" />
            {'\u51fa\u6d77\u58f0\u91cf\u67a2\u7ebd'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {'\u793e\u4ea4\u5a92\u4f53 + PR \u4e00\u4f53\u5316\u7ba1\u7406 \u00b7 AI \u5185\u5bb9\u6539\u5199 \u00b7 \u591a\u5e73\u53f0\u5206\u53d1\u8ffd\u8e2a'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('content-bridge')}
            className="bg-white text-navy-900 border border-border px-5 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Repeat2 size={16} />
            AI {'\u6539\u5199'}
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className="bg-navy-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center gap-2"
          >
            <Plus size={18} />
            {'\u521b\u5efa\u5185\u5bb9'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold transition-all relative flex items-center gap-2 rounded-t-xl whitespace-nowrap ${
              activeTab === tab.id 
                ? 'text-navy-900 bg-ivory-surface border border-border border-b-ivory-surface -mb-px' 
                : 'text-slate-400 hover:text-navy-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-ivory-surface border border-border rounded-[2rem] p-8">

        {/* ======== DASHBOARD ======== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Row 1: Social + PR combined */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{'\u5df2\u53d1\u5e03'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalPosts}</p>
                <p className="text-[10px] text-slate-400">{'\u793e\u4ea4\u5e16\u5b50'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{'\u5f85\u53d1\u5e03'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">{stats.scheduledPosts}</p>
                <p className="text-[10px] text-slate-400">{'\u5df2\u6392\u7a0b'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{'\u66dd\u5149\u91cf'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalImpressions.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">{'\u7d2f\u8ba1'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-pink-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{'\u4e92\u52a8'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalEngagement}</p>
                <p className="text-[10px] text-slate-400">{'\u70b9\u8d5e+\u8bc4\u8bba+\u5206\u4eab'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={16} className="text-indigo-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">PR {'\u7a3f\u4ef6'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalPR}</p>
                <p className="text-[10px] text-slate-400">{stats.prDrafts} {'\u8349\u7a3f'} / {stats.prDistributed} {'\u5df2\u5206\u53d1'}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{'\u4e92\u52a8\u7387'}</span>
                </div>
                <p className="text-2xl font-bold text-navy-900">
                  {stats.totalImpressions > 0 ? ((stats.totalEngagement / stats.totalImpressions) * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-[10px] text-slate-400">{'\u5e73\u5747'}</p>
              </div>
            </div>

            {/* Connected Accounts */}
            <div>
              <h3 className="text-sm font-bold text-navy-900 mb-4">{'\u5df2\u8fde\u63a5\u8d26\u53f7'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map(account => (
                  <div key={account.id} className="bg-white p-5 rounded-2xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getPlatformBg(account.platform)}`}>
                        {getPlatformIcon(account.platform, 20)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.handle}</p>
                      </div>
                    </div>
                    {account.connected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-bold">{'\u5df2\u8fde\u63a5'}</span>
                      </div>
                    ) : (
                      <button onClick={() => handleConnectAccount(account.platform)} className="text-xs font-bold text-gold hover:text-gold/80 transition-colors">
                        {'\u8fde\u63a5\u8d26\u53f7'} {'\u2192'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity: 2-column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Posts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy-900">{'\u6700\u8fd1\u793e\u4ea4\u5185\u5bb9'}</h3>
                  <button onClick={() => setActiveTab('compose')} className="text-xs text-gold font-bold">{'\u67e5\u770b\u5168\u90e8'} {'\u2192'}</button>
                </div>
                <div className="space-y-3">
                  {posts.slice(0, 4).map(post => (
                    <div key={post.id} className="bg-white p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)}
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-xs text-navy-900 line-clamp-2">{post.content}</p>
                      {post.metrics && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5"><Eye size={10} /> {post.metrics.impressions}</span>
                          <span className="flex items-center gap-0.5"><Heart size={10} /> {post.metrics.likes}</span>
                          <span className="flex items-center gap-0.5"><Share2 size={10} /> {post.metrics.shares}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent PR */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy-900">{'\u6700\u8fd1 PR \u7a3f\u4ef6'}</h3>
                  <button onClick={() => setActiveTab('pr-hub')} className="text-xs text-gold font-bold">{'\u67e5\u770b\u5168\u90e8'} {'\u2192'}</button>
                </div>
                <div className="space-y-3">
                  {prArticles.slice(0, 4).map(article => (
                    <div key={article.id} className="bg-white p-4 rounded-2xl border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{getCategoryLabel(article.category)}</span>
                        {getPRStatusBadge(article.status)}
                      </div>
                      <p className="text-xs font-bold text-navy-900 line-clamp-1">{article.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{article.keywords.slice(0, 3).join(' \u00b7 ')}</p>
                    </div>
                  ))}
                  {prArticles.length === 0 && (
                    <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">
                      {'\u6682\u65e0 PR \u7a3f\u4ef6\uff0c'}<button onClick={() => setActiveTab('pr-hub')} className="text-gold font-bold">{'\u521b\u5efa\u7b2c\u4e00\u7bc7'}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-navy-900 mb-4">{'\u5e73\u53f0\u6570\u636e'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['x', 'facebook', 'linkedin'] as PlatformType[]).map(platform => {
                  const platformPosts = posts.filter(p => p.platforms.includes(platform) && p.status === 'published');
                  const imp = platformPosts.reduce((a, p) => a + (p.metrics?.impressions || 0), 0);
                  const eng = platformPosts.reduce((a, p) => a + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0), 0);
                  return (
                    <div key={platform} className="bg-white p-5 rounded-2xl border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getPlatformBg(platform)}`}>
                          {getPlatformIcon(platform, 20)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-navy-900">{getPlatformLabel(platform)}</h4>
                          <p className="text-[10px] text-slate-400">{platformPosts.length} {'\u7bc7\u5df2\u53d1\u5e03'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{'\u66dd\u5149'}</p>
                          <p className="text-base font-bold text-navy-900 font-mono">{imp.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{'\u4e92\u52a8'}</p>
                          <p className="text-base font-bold text-navy-900 font-mono">{eng}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{'\u4e92\u52a8\u7387'}</p>
                          <p className="text-base font-bold text-navy-900 font-mono">{imp > 0 ? ((eng / imp) * 100).toFixed(1) : '0.0'}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======== COMPOSE (Social Publishing) ======== */}
        {activeTab === 'compose' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-lg font-bold text-navy-900">{'\u521b\u5efa\u793e\u4ea4\u5185\u5bb9'}</h3>
            
            {/* Platform Selection */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">{'\u53d1\u5e03\u5e73\u53f0'}</label>
              <div className="flex gap-3 flex-wrap">
                {(['x', 'facebook', 'linkedin'] as PlatformType[]).map(platform => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform])}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      selectedPlatforms.includes(platform) ? 'border-gold bg-gold/5 text-navy-900' : 'border-border text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {getPlatformIcon(platform)}
                    <span className="text-sm font-bold">{getPlatformLabel(platform)}</span>
                    {selectedPlatforms.includes(platform) && <CheckCircle2 size={16} className="text-gold" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">{'\u5185\u5bb9'}</label>
              <textarea
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                placeholder={'\u8f93\u5165\u4f60\u8981\u53d1\u5e03\u7684\u5185\u5bb9...'}
                className="w-full h-40 p-4 border border-border rounded-2xl text-sm text-navy-900 focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all outline-none resize-none"
              />
              <div className="flex justify-between mt-2">
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-all"><ImageIcon size={18} /></button>
                  <button className="p-2 text-slate-400 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-all"><Link2 size={18} /></button>
                  <button onClick={() => setActiveTab('content-bridge')} className="p-2 text-slate-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-all" title="AI \u6539\u5199"><Sparkles size={18} /></button>
                </div>
                <span className={`text-xs ${composeContent.length > 280 ? 'text-red-500' : 'text-slate-400'}`}>
                  {composeContent.length}/{selectedPlatforms.includes('linkedin') ? '3000' : '280'}
                </span>
              </div>
            </div>

            {/* Schedule Options */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">{'\u53d1\u5e03\u65f6\u95f4'}</label>
              <div className="flex gap-3">
                <button onClick={() => setIsPublishNow(true)} className={`flex-1 p-4 rounded-xl border transition-all ${isPublishNow ? 'border-gold bg-gold/5' : 'border-border hover:border-slate-300'}`}>
                  <Send size={18} className={isPublishNow ? 'text-gold' : 'text-slate-400'} />
                  <p className="text-sm font-bold text-navy-900 mt-2">{'\u7acb\u5373\u53d1\u5e03'}</p>
                </button>
                <button onClick={() => setIsPublishNow(false)} className={`flex-1 p-4 rounded-xl border transition-all ${!isPublishNow ? 'border-gold bg-gold/5' : 'border-border hover:border-slate-300'}`}>
                  <Clock size={18} className={!isPublishNow ? 'text-gold' : 'text-slate-400'} />
                  <p className="text-sm font-bold text-navy-900 mt-2">{'\u6392\u7a0b\u53d1\u5e03'}</p>
                </button>
              </div>
              {!isPublishNow && (
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full mt-3 p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none" />
              )}
            </div>

            <button onClick={handlePublish} disabled={isLoading}
              className="w-full bg-navy-900 text-white py-4 rounded-2xl text-sm font-bold hover:bg-navy-800 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <><RefreshCw size={18} className="animate-spin" />{'\u5904\u7406\u4e2d...'}</> : <>{isPublishNow ? <Send size={18} /> : <Clock size={18} />}{isPublishNow ? '\u7acb\u5373\u53d1\u5e03' : '\u6392\u7a0b\u53d1\u5e03'}</>}
            </button>
          </div>
        )}

        {/* ======== PR HUB ======== */}
        {activeTab === 'pr-hub' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-navy-900">PR {'\u4e2d\u67a2'}</h3>
              <button onClick={resetPRForm} className="text-xs font-bold text-gold hover:text-gold/80 flex items-center gap-1">
                <Plus size={14} /> {'\u65b0\u5efa\u7a3f\u4ef6'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Editor */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                  <h4 className="text-sm font-bold text-navy-900">{prEditing ? '\u7f16\u8f91\u7a3f\u4ef6' : '\u65b0\u5efa PR \u7a3f\u4ef6'}</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u7c7b\u578b'}</label>
                    <div className="flex gap-2">
                      {(['news-release', 'industry-article', 'case-study'] as PRArticle['category'][]).map(cat => (
                        <button key={cat} onClick={() => setPrCategory(cat)}
                          className={`text-xs px-3 py-2 rounded-lg border transition-all font-bold ${prCategory === cat ? 'border-gold bg-gold/5 text-navy-900' : 'border-border text-slate-500'}`}>
                          {getCategoryLabel(cat)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u6807\u9898'} *</label>
                    <input value={prTitle} onChange={e => setPrTitle(e.target.value)} placeholder={'\u7a3f\u4ef6\u6807\u9898'}
                      className="w-full p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u526f\u6807\u9898'}</label>
                    <input value={prSubtitle} onChange={e => setPrSubtitle(e.target.value)} placeholder={'\u53ef\u9009\u526f\u6807\u9898'}
                      className="w-full p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u6b63\u6587'} *</label>
                    <textarea value={prBody} onChange={e => setPrBody(e.target.value)} placeholder={'\u7a3f\u4ef6\u6b63\u6587\u5185\u5bb9...'}
                      className="w-full h-48 p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u5173\u952e\u8bcd'}</label>
                    <input value={prKeywords} onChange={e => setPrKeywords(e.target.value)} placeholder={'\u7528\u9017\u53f7\u5206\u9694\uff0c\u5982: robotic painting, automation'}
                      className="w-full p-3 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSavePR} disabled={isLoading}
                      className="flex-1 bg-navy-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-navy-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                      {prEditing ? '\u66f4\u65b0\u7a3f\u4ef6' : '\u4fdd\u5b58\u8349\u7a3f'}
                    </button>
                    {prEditing && (
                      <button onClick={resetPRForm} className="px-4 py-3 border border-border rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                        {'\u53d6\u6d88'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Article List */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{'\u7a3f\u4ef6\u5217\u8868'} ({prArticles.length})</h4>
                {prArticles.length === 0 && (
                  <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">{'\u6682\u65e0 PR \u7a3f\u4ef6'}</div>
                )}
                {prArticles.map(article => (
                  <div key={article.id} className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:border-slate-300 ${prEditing?.id === article.id ? 'border-gold ring-2 ring-gold/20' : 'border-border'}`}
                    onClick={() => startEditPR(article)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{getCategoryLabel(article.category)}</span>
                      {getPRStatusBadge(article.status)}
                    </div>
                    <p className="text-xs font-bold text-navy-900 line-clamp-2">{article.title}</p>
                    {article.distributions.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600">
                        <Megaphone size={10} /> {article.distributions.length} {'\u5e73\u53f0\u5df2\u5206\u53d1'}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-400">{article.updatedAt?.slice(0, 10)}</span>
                      <button onClick={e => { e.stopPropagation(); handleDeletePR(article.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======== CONTENT BRIDGE ======== */}
        {activeTab === 'content-bridge' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Repeat2 size={20} className="text-gold" />
                {'\u5185\u5bb9\u6865\u63a5'} - AI {'\u667a\u80fd\u6539\u5199'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{'\u5c06\u957f\u6587\u5185\u5bb9\uff08\u8425\u9500\u7d20\u6750\u3001\u5ba2\u6237\u6848\u4f8b\u3001\u6280\u672f\u6587\u6863\uff09\u667a\u80fd\u6539\u5199\u4e3a\u793e\u4ea4\u5e16\u5b50\u6216 PR \u7a3f\u4ef6'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Source */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
                  <h4 className="text-sm font-bold text-navy-900">{'\u6e90\u6587\u672c'}</h4>
                  <textarea value={bridgeSourceText} onChange={e => setBridgeSourceText(e.target.value)}
                    placeholder={'\u7c98\u8d34\u8981\u6539\u5199\u7684\u957f\u6587\u5185\u5bb9...\n\n\u652f\u6301\uff1a\u8425\u9500\u7d20\u6750 (ContentAsset)\u3001\u5ba2\u6237\u6848\u4f8b\u3001\u6280\u672f\u6587\u6863\u3001\u535a\u5ba2\u6587\u7ae0\u7b49'}
                    className="w-full h-64 p-4 border border-border rounded-xl text-sm focus:ring-2 focus:ring-gold/30 outline-none resize-none" />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u76ee\u6807\u683c\u5f0f'}</label>
                      <div className="flex gap-2">
                        <button onClick={() => setBridgeTargetFormat('social-post')}
                          className={`text-xs px-3 py-2 rounded-lg border font-bold transition-all ${bridgeTargetFormat === 'social-post' ? 'border-gold bg-gold/5 text-navy-900' : 'border-border text-slate-500'}`}>
                          {'\u793e\u4ea4\u5e16\u5b50'}
                        </button>
                        <button onClick={() => setBridgeTargetFormat('pr-article')}
                          className={`text-xs px-3 py-2 rounded-lg border font-bold transition-all ${bridgeTargetFormat === 'pr-article' ? 'border-gold bg-gold/5 text-navy-900' : 'border-border text-slate-500'}`}>
                          PR {'\u7a3f\u4ef6'}
                        </button>
                      </div>
                    </div>
                    {bridgeTargetFormat === 'social-post' && (
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{'\u76ee\u6807\u5e73\u53f0'}</label>
                        <div className="flex gap-2">
                          {(['linkedin', 'x', 'facebook'] as PlatformType[]).map(p => (
                            <button key={p} onClick={() => setBridgePlatform(p)}
                              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-lg border font-bold transition-all ${bridgePlatform === p ? 'border-gold bg-gold/5' : 'border-border text-slate-500'}`}>
                              {getPlatformIcon(p, 14)} {getPlatformLabel(p).split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={handleRewrite} disabled={isBridgeLoading || !bridgeSourceText.trim()}
                    className="w-full bg-gradient-to-r from-navy-900 to-indigo-800 text-white py-3 rounded-xl text-sm font-bold hover:from-navy-800 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isBridgeLoading ? <><RefreshCw size={16} className="animate-spin" />AI {'\u6539\u5199\u4e2d...'}</> : <><Sparkles size={16} />AI {'\u667a\u80fd\u6539\u5199'}</>}
                  </button>
                </div>
              </div>

              {/* Right: Result */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-border space-y-4 min-h-[400px]">
                  <h4 className="text-sm font-bold text-navy-900">{'\u6539\u5199\u7ed3\u679c'}</h4>
                  {!bridgeResult && !isBridgeLoading && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                      <Sparkles size={32} />
                      <p className="text-xs mt-3">{'\u8f93\u5165\u6e90\u6587\u672c\u5e76\u70b9\u51fb AI \u6539\u5199'}</p>
                    </div>
                  )}
                  {isBridgeLoading && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <RefreshCw size={24} className="animate-spin" />
                      <p className="text-xs mt-3">AI {'\u6b63\u5728\u5206\u6790\u548c\u6539\u5199\u5185\u5bb9...'}</p>
                    </div>
                  )}
                  {bridgeResult && (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-navy-900 whitespace-pre-wrap">{bridgeResult.rewritten}</p>
                      </div>
                      {bridgeResult.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {bridgeResult.hashtags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {bridgeResult.cta && (
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">CTA: </span>
                          <span className="text-xs text-amber-800">{bridgeResult.cta}</span>
                        </div>
                      )}
                      {bridgeTargetFormat === 'social-post' && (
                        <button onClick={useBridgeResultAsPost}
                          className="w-full bg-gold/10 text-navy-900 py-3 rounded-xl text-sm font-bold hover:bg-gold/20 transition-all flex items-center justify-center gap-2 border border-gold/30">
                          <ArrowRight size={16} /> {'\u5bfc\u5165\u5230\u793e\u4ea4\u53d1\u5e03'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======== CALENDAR ======== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-navy-900">{'\u5185\u5bb9\u6392\u7a0b\u65e5\u5386'}</h3>
              <button onClick={() => setActiveTab('compose')} className="text-xs font-bold text-gold hover:text-gold/80 transition-colors flex items-center gap-1">
                <Plus size={14} /> {'\u65b0\u5efa\u6392\u7a0b'}
              </button>
            </div>

            {(() => {
              const scheduled = posts.filter(p => p.status === 'scheduled');
              const published = posts.filter(p => p.status === 'published').slice(0, 5);
              const drafts = posts.filter(p => p.status === 'draft');
              const prDrafts = prArticles.filter(a => a.status === 'draft' || a.status === 'review');

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Drafts */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-slate-300" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{'\u8349\u7a3f'} ({drafts.length})</span>
                    </div>
                    {drafts.length === 0 ? (
                      <div className="p-6 border border-dashed border-border rounded-2xl text-center text-xs text-slate-400">{'\u6682\u65e0\u8349\u7a3f'}</div>
                    ) : drafts.map(post => (
                      <div key={post.id} className="bg-white p-4 rounded-2xl border border-border hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          {post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)}
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-xs text-navy-900 line-clamp-3">{post.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Scheduled */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{'\u5df2\u6392\u7a0b'} ({scheduled.length})</span>
                    </div>
                    {scheduled.length === 0 ? (
                      <div className="p-6 border border-dashed border-amber-200 rounded-2xl text-center text-xs text-slate-400">{'\u6682\u65e0\u6392\u7a0b\u5185\u5bb9'}</div>
                    ) : scheduled.map(post => (
                      <div key={post.id} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 hover:border-amber-300 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          {post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)}
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-xs text-navy-900 line-clamp-3">{post.content}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 font-bold">
                          <Clock size={10} /> {post.scheduledFor}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Published */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{'\u5df2\u53d1\u5e03'} ({published.length})</span>
                    </div>
                    {published.length === 0 ? (
                      <div className="p-6 border border-dashed border-emerald-200 rounded-2xl text-center text-xs text-slate-400">{'\u6682\u65e0\u5df2\u53d1\u5e03\u5185\u5bb9'}</div>
                    ) : published.map(post => (
                      <div key={post.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                          {post.platforms.map(p => <span key={p}>{getPlatformIcon(p)}</span>)}
                          {getStatusBadge(post.status)}
                        </div>
                        <p className="text-xs text-navy-900 line-clamp-3">{post.content}</p>
                        {post.metrics && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-0.5"><Eye size={10} /> {post.metrics.impressions}</span>
                            <span className="flex items-center gap-0.5"><Heart size={10} /> {post.metrics.likes}</span>
                            <span className="flex items-center gap-0.5"><Share2 size={10} /> {post.metrics.shares}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
                          <CheckCircle2 size={10} /> {post.publishedAt}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PR Drafts Column */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-400" />
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">PR {'\u5f85\u53d1'} ({prDrafts.length})</span>
                    </div>
                    {prDrafts.length === 0 ? (
                      <div className="p-6 border border-dashed border-indigo-200 rounded-2xl text-center text-xs text-slate-400">{'\u6682\u65e0\u5f85\u53d1 PR'}</div>
                    ) : prDrafts.map(article => (
                      <div key={article.id} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer"
                        onClick={() => { startEditPR(article); setActiveTab('pr-hub'); }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Newspaper size={12} className="text-indigo-500" />
                          {getPRStatusBadge(article.status)}
                        </div>
                        <p className="text-xs font-bold text-navy-900 line-clamp-2">{article.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{getCategoryLabel(article.category)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ======== SETTINGS ======== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-navy-900">{'\u8d26\u53f7\u7ba1\u7406'}</h3>
            <div className="space-y-4">
              {/* X Account */}
              <div className="bg-white p-6 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Twitter size={24} className="text-slate-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">X (Twitter)</h4>
                      <p className="text-xs text-slate-500">{'\u8fde\u63a5\u4f01\u4e1a X \u8d26\u53f7\u4ee5\u53d1\u5e03\u548c\u8ffd\u8e2a\u5185\u5bb9'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleConnectAccount('x')}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                    {accounts.find(a => a.platform === 'x')?.connected ? '\u91cd\u65b0\u6388\u6743' : '\u8fde\u63a5\u8d26\u53f7'}
                  </button>
                </div>
              </div>

              {/* Facebook Account */}
              <div className="bg-white p-6 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Facebook size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">Facebook</h4>
                      <p className="text-xs text-slate-500">{'\u8fde\u63a5\u4f01\u4e1a Facebook \u4e3b\u9875\u4ee5\u53d1\u5e03\u548c\u8ffd\u8e2a\u5185\u5bb9'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleConnectAccount('facebook')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                    {accounts.find(a => a.platform === 'facebook')?.connected ? '\u91cd\u65b0\u6388\u6743' : '\u8fde\u63a5\u8d26\u53f7'}
                  </button>
                </div>
              </div>

              {/* LinkedIn Account */}
              <div className="bg-white p-6 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Linkedin size={24} className="text-blue-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">LinkedIn</h4>
                      <p className="text-xs text-slate-500">{'\u8fde\u63a5\u4f01\u4e1a LinkedIn \u9875\u9762\uff0c\u53d1\u5e03\u4e13\u4e1a\u5185\u5bb9\u4e0e\u884c\u4e1a\u6d1e\u5bdf'}</p>
                      {!accounts.find(a => a.platform === 'linkedin')?.connected && (
                        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {'\u5f53\u524d\u4e3a Mock \u6a21\u5f0f\uff0c\u8bbe\u7f6e LINKEDIN_CLIENT_ID \u542f\u7528\u771f\u5b9e OAuth'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleConnectAccount('linkedin')}
                    className="px-5 py-2.5 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all">
                    {accounts.find(a => a.platform === 'linkedin')?.connected ? '\u91cd\u65b0\u6388\u6743' : '\u8fde\u63a5\u8d26\u53f7'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SocialPresence;

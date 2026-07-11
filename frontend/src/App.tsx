import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Link2, 
  ThumbsUp, 
  MessageSquare, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Info,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ScrapedPost {
  url: string;
  author: {
    name: string;
    headline?: string;
    profileUrl?: string;
  };
  content: string;
  images: string[];
  likes?: number;
  comments?: number;
  postedAt?: string;
  scrapedAt: string;
}

const STAGES = [
  'Warming up the secure browser instance...',
  'Navigating anonymously to the LinkedIn post...',
  'Bypassing initial redirects & cookie banners...',
  'Evaluating DOM content and checking for auth walls...',
  'Extracting post text and author metadata...',
  'Locating image references and attachments...',
  'Parsing engagement metrics (likes & comments)...',
  'Wrapping up parsed outputs...'
];

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [post, setPost] = useState<ScrapedPost | null>(null);
  const [copied, setCopied] = useState(false);

  // Cycle loading stages to keep the user engaged
  useEffect(() => {
    let interval: any;
    if (loading) {
      setStageIndex(0);
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPost(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError({
          code: result.error?.code || 'ERROR',
          message: result.error?.message || 'An unexpected error occurred.'
        });
      } else {
        setPost(result.data);
      }
    } catch (err) {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Could not connect to the scraper server. Please make sure the backend is running.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!post) return;
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!post) return;
    const md = `
# LinkedIn Post by ${post.author.name}
*Headline: ${post.author.headline || 'N/A'}*
*Scraped from: ${post.url}*
*Date: ${post.postedAt || 'Recently'}*

---

${post.content}

---

## Metrics
- Likes: ${post.likes ?? 0}
- Comments: ${post.comments ?? 0}
- Scraped At: ${new Date(post.scrapedAt).toLocaleString()}
    `.trim();

    const blob = new Blob([md], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `linkedin-post-${post.author.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Decorative Gradients / Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b13]/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LinkPeek
              </span>
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 flex items-center space-x-1"
            >
              <span>Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="font-outfit text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            LinkedIn Public Post Scraper
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Paste a public LinkedIn post URL below to extract post text, high-res images, and engagement stats.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScrape} className="mb-8">
          <div className="relative group">
            {/* Input Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
            
            <div className="relative flex flex-col sm:flex-row gap-3 bg-[#0d1321] border border-slate-800 rounded-2xl p-2.5">
              <div className="flex-1 flex items-center space-x-3 px-3">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/posts/username_post-text-slug-activity-12345..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 text-sm focus:ring-0 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-medium text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center space-x-2 transition-all duration-300 select-none group/btn shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Data</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* --- Scraper States --- */}

        {/* Loading Spinner with stages */}
        {loading && (
          <div className="backdrop-blur-md bg-[#0d1321]/60 border border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center shadow-xl animate-fade-in">
            <div className="relative mb-6">
              <div className="w-14 h-14 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="font-outfit font-semibold text-lg text-slate-200 mb-2">Analyzing Post Details</h3>
            <p className="text-sm text-slate-400 max-w-sm h-12 transition-all duration-300">
              {STAGES[stageIndex]}
            </p>
            <div className="w-48 bg-slate-800/50 h-1.5 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500" 
                style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Container */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex space-x-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-outfit font-bold text-lg text-slate-200">
                    Extraction Failed ({error.code})
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {error.message}
                </p>

                {/* Helpful tips based on error code */}
                <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/60 text-xs text-slate-400 flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block mb-1">Troubleshooting Tips:</span>
                    {error.code === 'LOGIN_REQUIRED' && (
                      <p>This post is either private, requires a LinkedIn account session to view, or the poster has restricted access. Ensure the link points to a fully public post.</p>
                    )}
                    {error.code === 'CAPTCHA_REQUIRED' && (
                      <p>LinkedIn presented a verification challenge. Wait a minute and try again, or check the URL format.</p>
                    )}
                    {error.code === 'INVALID_URL' && (
                      <p>The URL is not supported. Please double check that it starts with <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-400">https://www.linkedin.com/posts/...</code> or similar.</p>
                    )}
                    {error.code === 'POST_NOT_FOUND' && (
                      <p>The post may have been deleted, the poster profile is deactivated, or the link is broken.</p>
                    )}
                    {error.code === 'LINKEDIN_BLOCKED' && (
                      <p>LinkedIn rate limits or blocks requests when detecting automated browsers. Retrying after a short delay may solve the issue.</p>
                    )}
                    {!['LOGIN_REQUIRED', 'CAPTCHA_REQUIRED', 'INVALID_URL', 'POST_NOT_FOUND', 'LINKEDIN_BLOCKED'].includes(error.code) && (
                      <p>Check that the post link is correct, public, and can be viewed without logging in when using incognito mode.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scraped Results (Success Card) */}
        {post && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-[#0d1321] border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Extracted: {new Date(post.scrapedAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-1.5 transition duration-200 shadow-sm border border-slate-700/50"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-1.5 transition duration-200 shadow-sm border border-slate-700/50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export MD</span>
                </button>
              </div>
            </div>

            {/* Simulated LinkedIn Card */}
            <div className="backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
              
              {/* Header: Author info */}
              <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-800/40">
                <div className="flex space-x-4">
                  
                  {/* Avatar Icon */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center shrink-0 font-outfit text-blue-400 font-bold text-lg">
                    {getInitials(post.author.name)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      {post.author.profileUrl ? (
                        <a 
                          href={post.author.profileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="font-outfit font-bold text-slate-100 hover:text-blue-400 hover:underline flex items-center space-x-1 transition duration-150"
                        >
                          <span>{post.author.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 inline text-slate-500" />
                        </a>
                      ) : (
                        <span className="font-outfit font-bold text-slate-100">{post.author.name}</span>
                      )}
                      
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Poster
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal mt-0.5 max-w-xl">
                      {post.author.headline}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{post.postedAt || 'Recently'}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 p-2.5 rounded-xl transition duration-150 flex items-center justify-center"
                  title="Open Original Post"
                >
                  <Link2 className="w-4 h-4" />
                </a>
              </div>

              {/* Body: Post Content */}
              <div className="p-6 py-5">
                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed select-text font-normal">
                  {post.content}
                </p>
              </div>

              {/* Media: Image attachments */}
              {post.images && post.images.length > 0 && (
                <div className="border-t border-b border-slate-800/40 bg-slate-950/20">
                  <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.images.map((src, i) => (
                      <div key={i} className="relative overflow-hidden aspect-video group">
                        <img 
                          src={src} 
                          alt={`Attached media ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-102 transition duration-500" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: Social Counts */}
              <div className="p-6 py-4 bg-[#0a0e1a]/40 border-t border-slate-800/30 flex items-center justify-between text-slate-400">
                <div className="flex space-x-6 text-sm">
                  
                  {/* Likes Pill */}
                  <div className="flex items-center space-x-2 bg-slate-800/40 px-3.5 py-1.5 rounded-full border border-slate-700/30 text-slate-300">
                    <ThumbsUp className="w-4 h-4 text-blue-400 fill-blue-400/10" />
                    <span className="font-semibold text-slate-200">{post.likes ?? 0}</span>
                    <span className="text-xs text-slate-500">Likes</span>
                  </div>

                  {/* Comments Pill */}
                  <div className="flex items-center space-x-2 bg-slate-800/40 px-3.5 py-1.5 rounded-full border border-slate-700/30 text-slate-300">
                    <MessageSquare className="w-4 h-4 text-indigo-400 fill-indigo-400/10" />
                    <span className="font-semibold text-slate-200">{post.comments ?? 0}</span>
                    <span className="text-xs text-slate-500">Comments</span>
                  </div>

                </div>
                
                <span className="text-[11px] text-slate-500 italic">
                  Public post data
                </span>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500 bg-[#070b13]">
        <div className="max-w-6xl mx-auto px-6">
          <p>© 2026 LinkPeek Scraper. Built as a single-repo Node.js + React deployment.</p>
          <p className="mt-1 text-slate-600">Ensure scraping complies with target platform Terms of Service and local privacy regulations.</p>
        </div>
      </footer>

    </div>
  );
}

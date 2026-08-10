import React, { useState, useEffect } from "react";
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
  Sparkles,
  ArrowRight,
  Users,
  ChevronDown,
  ShieldCheck,
  Zap,
  FileText,
  Code2,
  ImageIcon,
} from "lucide-react";
import { Site } from "./Site";

// ─── Types matching backend JsonLdResult ─────────────────────────────────────

interface JsonLdResult {
  exists: boolean;
  objects: Record<string, any>[];
  socialMediaPosting?: Record<string, any>;
  scripts: string[];
}

/** Normalised post data extracted from the SocialMediaPosting JSON-LD object. */
interface NormalisedPost {
  url: string;
  authorName: string;
  authorUrl?: string;
  authorFollowers?: number;
  authorImageUrl?: string;
  content: string;
  headline?: string;
  images: string[];
  likes: number;
  comments: number;
  postedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalisePost(
  raw: JsonLdResult,
  inputUrl: string,
): NormalisedPost | null {
  const smp = raw.socialMediaPosting;
  if (!smp) return null;

  // Author
  const author = smp.author ?? {};
  const authorName: string = author.name ?? "LinkedIn Member";
  const authorUrl: string | undefined = author.url;

  // Author followers from author.interactionStatistic
  let authorFollowers: number | undefined;
  const authorStat = author.interactionStatistic;
  if (authorStat && typeof authorStat === "object") {
    if (authorStat.userInteractionCount !== undefined) {
      authorFollowers = Number(authorStat.userInteractionCount);
    }
  }

  // Author image
  let authorImageUrl: string | undefined;
  if (author.image) {
    if (typeof author.image === "string") {
      authorImageUrl = author.image;
    } else if (author.image.url) {
      authorImageUrl = author.image.url;
    } else if (author.image.contentUrl) {
      authorImageUrl = author.image.contentUrl;
    }
  }

  // Content
  const content: string = smp.articleBody ?? "";

  // Headline
  const headline: string | undefined = smp.headline;

  // Images
  const images: string[] = [];
  if (smp.image) {
    if (typeof smp.image === "string") {
      images.push(smp.image);
    } else if (Array.isArray(smp.image)) {
      for (const img of smp.image) {
        if (typeof img === "string") images.push(img);
        else if (img?.url) images.push(img.url);
        else if (img?.contentUrl) images.push(img.contentUrl);
      }
    } else if (smp.image.url) {
      images.push(smp.image.url);
    } else if (smp.image.contentUrl) {
      images.push(smp.image.contentUrl);
    }
  }
  // Also check sharedContent for thumbnail images
  if (smp.sharedContent?.thumbnail) {
    const thumb = smp.sharedContent.thumbnail;
    if (typeof thumb === "string") images.push(thumb);
    else if (thumb?.url) images.push(thumb.url);
    else if (thumb?.contentUrl) images.push(thumb.contentUrl);
  }

  // Engagement: interactionStatistic array
  let likes = 0;
  let comments = 0;

  if (Array.isArray(smp.interactionStatistic)) {
    for (const stat of smp.interactionStatistic) {
      const type = stat.interactionType ?? "";
      const count = Number(stat.userInteractionCount ?? 0);
      if (type.includes("Like")) {
        likes = count;
      } else if (type.includes("Comment")) {
        comments = count;
      }
    }
  }

  // Direct commentCount field
  if (smp.commentCount !== undefined) {
    comments = Number(smp.commentCount);
  }

  // Date
  const postedAt = smp.datePublished ?? "Recently";

  // URL
  const url = smp.url ?? inputUrl;

  return {
    url,
    authorName,
    authorUrl,
    authorFollowers,
    authorImageUrl,
    content,
    headline,
    images,
    likes,
    comments,
    postedAt,
  };
}

function formatDate(isoOrText: string): string {
  try {
    const d = new Date(isoOrText);
    if (isNaN(d.getTime())) return isoOrText;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoOrText;
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

// ─── Loading Stages ──────────────────────────────────────────────────────────

const STAGES = [
  "Initializing secure browser context...",
  "Navigating to public LinkedIn post URL...",
  "Bypassing initial redirects & cookie overlays...",
  "Locating Schema.org JSON-LD structured data...",
  "Extracting SocialMediaPosting metadata & article body...",
  "Resolving author attributes, media assets & reactions...",
  "Formatting output card & markdown preview...",
];

// ─── Sample Post URL for testing ─────────────────────────────────────────────
const SAMPLE_URL =
  "https://www.linkedin.com/posts/rao-abrar-ahmad_growthmindset-leadership-success-activity-7470861241704431616-2cF6";

// ─── App Component ───────────────────────────────────────────────────────────

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<{ code: string; message: string } | null>(
    null,
  );
  const [post, setPost] = useState<NormalisedPost | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "text" | "markdown">(
    "card",
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Cycling loading stage text
  useEffect(() => {
    let interval: any;
    if (loading) {
      setStageIndex(0);
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 2500);
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
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError({
          code: result.error?.code || "ERROR",
          message:
            result.error?.message ||
            "An unexpected error occurred while processing your request.",
        });
      } else {
        const jsonLd: JsonLdResult = result.data;

        if (!jsonLd.exists || !jsonLd.socialMediaPosting) {
          setError({
            code: "NO_DATA",
            message:
              "No structured post data (JSON-LD) was detected on this page. The post may be private, restricted, or deleted.",
          });
          return;
        }

        const normalised = normalisePost(jsonLd, url.trim());
        if (!normalised || !normalised.content) {
          setError({
            code: "PARSE_ERROR",
            message:
              "Structured data was found, but post text could not be parsed. The post format may be unsupported.",
          });
          return;
        }

        setPost(normalised);
        setActiveTab("card");

        // Smooth scroll to result
        setTimeout(() => {
          document
            .getElementById("result-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      setError({
        code: "NETWORK_ERROR",
        message:
          "Unable to connect to the backend server. Please verify your connection or backend server status.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (textToCopy?: string) => {
    if (!post && !textToCopy) return;
    const content = textToCopy || post?.content || "";
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateMarkdown = () => {
    if (!post) return "";
    return `# LinkedIn Post by ${post.authorName}
${post.headline ? `*${post.headline}*\n` : ""}
**Source URL:** [View on LinkedIn](${post.url})  
**Date Published:** ${formatDate(post.postedAt)}

---

${post.content}

---

## Engagement & Details
- **Likes:** ${formatNumber(post.likes)}
- **Comments:** ${formatNumber(post.comments)}
${post.authorFollowers ? `- **Author Followers:** ${formatNumber(post.authorFollowers)}` : ""}
${post.images.length > 0 ? `\n## Media Attachments (${post.images.length})\n` + post.images.map((img, idx) => `![Post Image ${idx + 1}](${img})`).join("\n\n") : ""}
`;
  };

  const handleExportMarkdown = () => {
    if (!post) return;
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `linkedin-post-${post.authorName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    link.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const wordCount = post?.content
    ? post.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = post?.content ? post.content.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Decorative Light Background Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/10 to-sky-300/10 rounded-full blur-[100px]" />
      </div>

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & App Name */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-outfit text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                LPS{" "}
                <span className="hidden sm:inline font-normal text-slate-500">
                  | LinkedIn Post Scraper
                </span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                v1.0
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-blue-600 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a href="#faqs" className="hover:text-blue-600 transition-colors">
              FAQs
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <a
              href={Site.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Code2 className="w-4 h-4 text-slate-700" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-12">
        {/* ─── Hero Section ──────────────────────────────────────────────────── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>100% Free & Open Source Content Extraction</span>
          </div>

          {/* Headline */}
          <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            LinkedIn Post Scraper &{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Content Copier
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Extract public LinkedIn post text, author info, high-res images, and
            reaction metrics instantly. Copy text cleanly or export formatted
            Markdown — no login required.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleScrape} className="pt-2">
            <div className="relative group max-w-2xl mx-auto">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-md opacity-20 group-hover:opacity-35 transition duration-300" />

              {/* Form Input Bar */}
              <div className="relative flex flex-col sm:flex-row gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl shadow-slate-200/70">
                <div className="flex-1 flex items-center space-x-3 px-3 py-1">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="url"
                    placeholder="Paste LinkedIn post URL (e.g. https://www.linkedin.com/posts/...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-transparent border-0 outline-none text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:ring-0 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all duration-200 shrink-0 select-none group/btn cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scraping Data...</span>
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

            {/* Quick Demo Helper */}
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-slate-500">
              <span>Want to test quickly?</span>
              <button
                type="button"
                onClick={() => setUrl(SAMPLE_URL)}
                className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 cursor-pointer"
              >
                Fill sample LinkedIn post link
              </button>
            </div>
          </form>
        </section>

        {/* ─── Scraper Status & Output Section ───────────────────────── */}
        <section id="result-section" className="space-y-6">
          {/* Loading Indicator */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center shadow-lg shadow-slate-200/50 animate-fade-in max-w-xl mx-auto">
              <div className="relative mb-5">
                <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h3 className="font-outfit font-bold text-lg text-slate-900 mb-1">
                Scraping LinkedIn Post Metadata
              </h3>
              <p className="text-sm text-slate-500 max-w-sm h-10 transition-all duration-300">
                {STAGES[stageIndex]}
              </p>
              <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-4">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{
                    width: `${((stageIndex + 1) / STAGES.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-md animate-fade-in max-w-2xl mx-auto">
              <div className="flex space-x-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-outfit font-bold text-lg text-red-950">
                    Scraping Failed ({error.code})
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {error.message}
                  </p>
                  <div className="bg-white/80 rounded-xl p-4 border border-red-200 text-xs text-slate-600 flex items-start space-x-2.5 mt-3">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 block mb-1">
                        Troubleshooting Checklist:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>
                          Ensure the URL points to a public post (
                          <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">
                            linkedin.com/posts/...
                          </code>
                          ).
                        </li>
                        <li>
                          Private profile posts or group posts requiring
                          authentication cannot be scraped.
                        </li>
                        <li>
                          If LinkedIn returned rate-limiting or anti-bot checks,
                          try again in a few seconds.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Successful Scrape Output Card */}
          {post && (
            <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
              {/* View Switcher & Action Toolbar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                {/* View Tabs */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("card")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "card"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Card Preview
                  </button>
                  <button
                    onClick={() => setActiveTab("text")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "text"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Clean Text
                  </button>
                  <button
                    onClick={() => setActiveTab("markdown")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "markdown"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export MD</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Simulated Creative Light LinkedIn Card */}
              {activeTab === "card" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden transition-all">
                  {/* Header: Author Metadata */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-white">
                    <div className="flex space-x-4">
                      {/* Avatar */}
                      {post.authorImageUrl ? (
                        <img
                          src={post.authorImageUrl}
                          alt={post.authorName}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-slate-100 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-outfit font-bold text-lg shadow-md shrink-0">
                          {getInitials(post.authorName)}
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {post.authorUrl ? (
                            <a
                              href={post.authorUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-outfit font-bold text-slate-900 text-base sm:text-lg hover:text-blue-600 transition flex items-center space-x-1"
                            >
                              <span>{post.authorName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 inline" />
                            </a>
                          ) : (
                            <span className="font-outfit font-bold text-slate-900 text-base sm:text-lg">
                              {post.authorName}
                            </span>
                          )}

                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                            Poster
                          </span>
                        </div>

                        {/* Author headline if available */}
                        {post.headline && (
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                            {post.headline}
                          </p>
                        )}

                        {/* Subline: Date & Followers */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(post.postedAt)}</span>
                          </span>
                          {post.authorFollowers !== undefined &&
                            post.authorFollowers > 0 && (
                              <span className="flex items-center space-x-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {formatNumber(post.authorFollowers)} followers
                                </span>
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={post.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 border border-slate-200 transition shrink-0"
                      title="Open original post on LinkedIn"
                    >
                      <Link2 className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Body: Post Content */}
                  <div className="p-5 sm:p-7 space-y-4">
                    <p className="text-slate-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed select-text font-normal font-sans">
                      {post.content}
                    </p>

                    {/* Word & Char Stat Pills */}
                    <div className="flex items-center space-x-4 pt-2 text-xs text-slate-400 border-t border-slate-100">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>

                  {/* Media: Attached Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-3">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span>Attached Media ({post.images.length})</span>
                      </div>
                      <div
                        className={`grid gap-3 ${post.images.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                      >
                        {post.images.map((img, index) => (
                          <div
                            key={index}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center"
                          >
                            <img
                              src={img}
                              alt={`Post media attachment ${index + 1}`}
                              className="w-full h-full object-contain group-hover:scale-102 transition duration-300"
                            />
                            <a
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-slate-700 hover:text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition duration-200 flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View Full</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reaction Bar & Metrics Footer */}
                  <div className="p-5 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      {/* Likes Pill */}
                      <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                        <ThumbsUp className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-sm text-slate-900">
                          {formatNumber(post.likes)}
                        </span>
                        <span className="text-xs text-slate-500">Likes</span>
                      </div>

                      {/* Comments Pill */}
                      <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-sm text-slate-900">
                          {formatNumber(post.comments)}
                        </span>
                        <span className="text-xs text-slate-500">Comments</span>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Extracted via Schema.org JSON-LD</span>
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Clean Text View */}
              {activeTab === "text" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-outfit font-bold text-slate-900 text-sm">
                      Raw Post Text
                    </span>
                    <button
                      onClick={() => handleCopy(post.content)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy to Clipboard</span>
                    </button>
                  </div>
                  <pre className="text-slate-800 text-sm whitespace-pre-wrap font-mono leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 select-all overflow-x-auto">
                    {post.content}
                  </pre>
                </div>
              )}

              {/* TAB 3: Markdown Source View */}
              {activeTab === "markdown" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-outfit font-bold text-slate-900 text-sm">
                      Generated Markdown Output
                    </span>
                    <button
                      onClick={() => handleCopy(generateMarkdown())}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </button>
                  </div>
                  <pre className="text-slate-800 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed bg-slate-900 text-gray-200 p-4 rounded-xl overflow-x-auto select-all">
                    {generateMarkdown()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ─── How It Works Section ──────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="py-8 space-y-10 border-t border-slate-200/80"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Simple 3-Step Process
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900">
              How LinkedIn Post Scraper Works
            </h2>
            <p className="text-slate-600 text-base">
              Scrape and copy any public LinkedIn post content to text or
              markdown in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-outfit font-bold text-xl">
                1
              </div>
              <h3 className="font-outfit font-bold text-lg text-slate-900">
                Copy LinkedIn Post URL
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Find any public LinkedIn post, click the options menu or share
                button, and select <strong>"Copy link to post"</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-outfit font-bold text-xl">
                2
              </div>
              <h3 className="font-outfit font-bold text-lg text-slate-900">
                Paste in Content Copier
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Paste the URL into our input box above and click{" "}
                <strong>"Extract Data"</strong>. Our backend anonymously
                inspects the post structured data.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center font-outfit font-bold text-xl">
                3
              </div>
              <h3 className="font-outfit font-bold text-lg text-slate-900">
                Copy Text or Export MD
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                View the extracted post card, copy raw text with one click,
                download high-res images, or export a formatted Markdown file
                for Notion/Obsidian.
              </p>
            </div>
          </div>
        </section>

        {/* ─── What It Does / Helpful Use Cases Section ──────────────────────── */}
        <section
          id="features"
          className="py-8 space-y-10 border-t border-slate-200/80"
        >
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Comprehensive Capabilities
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900">
              What It Does & How It Helps You
            </h2>
            <p className="text-slate-600 text-base">
              Built for content creators, marketers, researchers, and developers
              who need a reliable <strong>linkedin content copier</strong> and{" "}
              <strong>linkedin post scraper</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                LinkedIn Post Copier & Text Extractor
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Copy full LinkedIn post text cleanly without line break errors,
                truncation, or awkward UI overlays. Perfect for repurposing
                posts across newsletters and blogs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                LinkedIn Post Image Scraper & Copier
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Extract high-resolution attached post images, photos, and
                carousel thumbnails. Preview and copy direct image URLs with our
                built-in image scraper.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                LinkedIn Post Checker & Detector
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Verify whether a post is public, inspect author profile details,
                check publication timestamps, and detect structured Schema.org
                JSON-LD metadata automatically.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                Export to Markdown (.md)
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Download formatted Markdown documents complete with author
                stats, engagement figures, and media links ready for Obsidian,
                Notion, or personal archives.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                Engagement & Metrics Scanner
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Scan public reaction counts including exact like numbers,
                comment totals, and author follower counts embedded in post
                structured data.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-outfit font-bold text-base text-slate-900">
                100% Free & No Login Needed
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                No browser extension installation, account registration, or API
                keys required. Operates completely anonymously and safely in
                your web browser.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Frequently Asked Questions (FAQs) Section ──────────────────────── */}
        <section
          id="faqs"
          className="py-8 space-y-8 border-t border-slate-200/80"
        >
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
              Got Questions?
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-base">
              Everything you need to know about our LinkedIn post scraper, post
              copier, and content duplicator.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "What is the LinkedIn Post Scraper & LinkedIn Content Copier tool?",
                a: "LPS (LinkedIn Post Scraper) is a free online tool designed as a linkedin post copier, linkedin content copier, linkedin content scraper, and linkedin content duplicator. It allows you to extract complete post text, author details, high-resolution post images, and engagement stats from any public LinkedIn post without logging in.",
              },
              {
                q: "How does the linkedin post image scraper and image copier feature work?",
                a: "Our built-in linkedin post image scraper parses the Schema.org SocialMediaPosting JSON-LD object returned by public LinkedIn post URLs. It locates all attached media URLs (single images or gallery carousels) so you can preview, copy image links, or download them directly.",
              },
              {
                q: "Can I use this tool as a linkedin post checker and linkedin post detector?",
                a: "Yes. LPS operates as a reliable linkedin post detector and linkedin post checker. It validates whether a post is public, detects published timestamps, parses author follower metrics, and verifies structured metadata formatting.",
              },
              {
                q: "How do I copy a LinkedIn post content to text or Markdown?",
                a: 'Simply paste the post link into our input field and click "Extract Data". Once extracted, click the "Copy Text" button to copy raw text to your clipboard, or click "Export MD" to save it as a Markdown file formatted for Notion, Obsidian, or documentation.',
              },
              {
                q: "Does this LinkedIn post scraper require a LinkedIn account login?",
                a: "No. LPS does not require any LinkedIn login, password, or browser extension. It accesses public JSON-LD structured data server-side via Playwright, ensuring your personal LinkedIn account remains completely untouched.",
              },
              {
                q: "What post URLs are supported by LinkedIn Post Scraper?",
                a: "LPS supports standard public LinkedIn post URLs, including linkedin.com/posts/..., linkedin.com/feed/update/urn:li:activity:..., and article URLs. The post must be publicly visible without requiring a logged-in session.",
              },
              {
                q: "Why does LPS use JSON-LD structured data extraction?",
                a: "LinkedIn embeds JSON-LD (Schema.org SocialMediaPosting) in all public post pages. Scraping JSON-LD guarantees high accuracy, prevents broken text formatting, and remains resilient against DOM class name changes.",
              },
              {
                q: "Is LinkedIn Post Scraper free and open-source?",
                a: "Yes. LPS is completely free to use with no usage fees or rate walls. The source code is open-source under the MIT license on GitHub at https://github.com/Rao-Abrar-Ahmad/linkedin-post-scraper, created by Rao Abrar Ahmad and CodebyRSA.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-outfit font-bold text-slate-900 text-base sm:text-lg hover:text-blue-600 transition cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12 text-slate-600 text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: App Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  LPS
                </div>
                <span className="font-outfit font-bold text-lg text-slate-900">
                  LinkedIn Post Scraper
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-md">
                The free, open-source <strong>linkedin post copier</strong>,{" "}
                <strong>linkedin post scraper</strong>, and{" "}
                <strong>linkedin content copier</strong>. Extract post text,
                high-res images, author details, and metrics cleanly.
              </p>
              <div className="pt-1 text-xs text-slate-400">
                Created by{" "}
                <a
                  href={Site.creator.social.linkdin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {Site.creator.name}
                </a>{" "}
                • Published by{" "}
                <a
                  href={Site.organization.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {Site.organization.name}
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="font-outfit font-bold text-slate-900 text-sm">
                Quick Links
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-500">
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-blue-600 transition"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-blue-600 transition"
                  >
                    Features & Benefits
                  </a>
                </li>
                <li>
                  <a href="#faqs" className="hover:text-blue-600 transition">
                    Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a
                    href={Site.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center space-x-1"
                  >
                    <span>GitHub Repository</span>{" "}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Creator & Organization Links */}
            <div className="space-y-3">
              <h4 className="font-outfit font-bold text-slate-900 text-sm">
                Creator
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-500">
                <li>
                  <a
                    href={Site.creator.social.linkdin}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center space-x-1"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href={Site.creator.social.github}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center space-x-1"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${Site.email}`}
                    className="hover:text-blue-600 transition"
                  >
                    Contact Creator
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© 2026 {Site.name}.</p>
            <p className="text-slate-400 text-center sm:text-right max-w-md">
              LPS is an independent open-source tool for public content
              analysis. Ensure scraping complies with target platform Terms of
              Service.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

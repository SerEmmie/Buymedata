import React, { useState, useEffect } from 'react';
import { useParams, Link } from '../../router';
import {
  getCreatorProfileByUsername,
  saveCreatorProfile,
} from '../../services/creatorService';
import { getCreatorCampaigns } from '../../services/campaignService';
import { getPublicSupporterMessages } from '../../services/paymentService';
import { submitReport } from '../../services/adminService';
import { CreatorProfile, Campaign, Contribution } from '../../types';
import { SupportBox } from '../../components/creator/SupportBox';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { SupporterMessageWall } from '../../components/creator/SupporterMessageWall';
import { formatCurrency } from '../../utils/formatters';
import {
  Globe,
  Share2,
  Check,
  Copy,
  Flag,
  Sparkles,
  ExternalLink,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Users,
  Flame,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';

export function CreatorPublicPage() {
  const { username } = useParams<{ username: string }>();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [supporterMessages, setSupporterMessages] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading information');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const loadCreatorData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const profile = await getCreatorProfileByUsername(username);
      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCreator(profile);

      // Fetch creator campaigns & public messages
      const [camps, messages] = await Promise.all([
        getCreatorCampaigns(profile.userId),
        getPublicSupporterMessages(profile.userId),
      ]);
      setCampaigns(
        camps.filter(
          (c) =>
            (c.status === 'active' || c.status === 'paused' || c.status === 'completed') &&
            c.visibility !== 'unlisted'
        )
      );
      setSupporterMessages(messages);
    } catch (err) {
      console.error('Error loading creator page:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorData();
  }, [username]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    await submitReport({
      reporterId: 'visitor',
      reportedUserId: creator.userId,
      reason: reportReason,
      description: reportDesc,
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setReportModalOpen(false);
      setReportSubmitted(false);
      setReportDesc('');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="pb-24 animate-pulse">
        {/* Skeleton Cover */}
        <div className="h-48 sm:h-64 md:h-80 w-full bg-gray-200" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gray-200" />
                <div className="h-6 bg-gray-200 rounded-lg w-48" />
                <div className="h-4 bg-gray-200 rounded-lg w-32" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-gray-200 rounded-md w-full" />
                  <div className="h-3 bg-gray-200 rounded-md w-4/5" />
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-24 bg-gray-100 rounded-2xl" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="h-6 bg-gray-200 rounded w-36" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded-xl" />
                  ))}
                </div>
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Creator Not Found</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          No BuyMeData creator page exists for <span className="font-semibold text-gray-800">@{username}</span>.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 bg-white text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            Go Home
          </Link>
          <Link
            to="/folatech"
            className="px-5 py-2.5 bg-[#F22550] text-white font-semibold text-xs rounded-xl hover:bg-[#D81A43]"
          >
            Explore Sample Creator (@folatech)
          </Link>
        </div>
      </div>
    );
  }

  // Calculate total public contributions if enabled
  const totalRaised = supporterMessages.reduce((sum, m) => sum + (m.amount || 0), 0);

  // Theme styling
  const themeClasses: Record<string, { banner: string; ring: string; badge: string; button: string }> = {
    crimson: { banner: 'from-[#F22550] to-[#D81A43]', ring: 'ring-[#F22550]', badge: 'bg-[#FFE6EA] text-[#F22550]', button: 'bg-[#F22550]' },
    violet: { banner: 'from-[#6741D9] to-indigo-600', ring: 'ring-[#6741D9]', badge: 'bg-[#F0EBFF] text-[#6741D9]', button: 'bg-[#6741D9]' },
    emerald: { banner: 'from-emerald-600 to-teal-700', ring: 'ring-emerald-600', badge: 'bg-emerald-50 text-emerald-700', button: 'bg-emerald-600' },
    amber: { banner: 'from-amber-600 to-orange-600', ring: 'ring-amber-600', badge: 'bg-amber-50 text-amber-700', button: 'bg-amber-600' },
    rose: { banner: 'from-rose-600 to-pink-600', ring: 'ring-rose-600', badge: 'bg-rose-50 text-rose-700', button: 'bg-rose-600' },
    ocean: { banner: 'from-cyan-600 to-blue-700', ring: 'ring-cyan-600', badge: 'bg-cyan-50 text-cyan-700', button: 'bg-cyan-600' },
    midnight: { banner: 'from-gray-900 to-slate-800', ring: 'ring-gray-900', badge: 'bg-gray-100 text-gray-900', button: 'bg-gray-900' },
  };

  const currentTheme = themeClasses[creator.theme] || themeClasses.crimson;

  return (
    <div className="pb-24">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden bg-gray-200">
        {creator.coverImage ? (
          <img
            src={creator.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${currentTheme.banner}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Main Profile Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Creator Bio, Campaigns, Updates & Wall */}
          <div className="lg:col-span-7 space-y-8">
            {/* Creator Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={creator.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={creator.displayName}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white shadow-md shadow-black/10 bg-white"
                  />
                  <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white" title="Verified Creator">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </div>

                {/* Share Page Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share Page'}</span>
                  </button>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    title="Report profile"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {creator.displayName}
                  </h1>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${currentTheme.badge}`}>
                    {creator.category || 'Creator'}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified Creator
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-400">@{creator.username}</p>

                {creator.biography && (
                  <p className="text-sm text-gray-700 leading-relaxed pt-2 whitespace-pre-line">
                    {creator.biography}
                  </p>
                )}
              </div>

              {/* Social Links & Website */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                {creator.website && (
                  <a
                    href={creator.website.startsWith('http') ? creator.website : `https://${creator.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#F22550] font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
                {creator.socialLinks?.twitter && (
                  <a
                    href={creator.socialLinks.twitter.startsWith('http') ? creator.socialLinks.twitter : `https://twitter.com/${creator.socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-sky-500 font-medium"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span>Twitter</span>
                  </a>
                )}
                {creator.socialLinks?.github && (
                  <a
                    href={
                      creator.socialLinks.github.startsWith('http')
                        ? creator.socialLinks.github
                        : `https://github.com/${creator.socialLinks.github.replace(/^@/, '').replace(/^github\.com\//, '')}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-gray-900 font-medium"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {creator.socialLinks?.linkedin && (
                  <a
                    href={creator.socialLinks.linkedin.startsWith('http') ? creator.socialLinks.linkedin : `https://linkedin.com/in/${creator.socialLinks.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-blue-600 font-medium"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {creator.socialLinks?.instagram && (
                  <a
                    href={creator.socialLinks.instagram.startsWith('http') ? creator.socialLinks.instagram : `https://instagram.com/${creator.socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-pink-600 font-medium"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </a>
                )}
                {creator.socialLinks?.youtube && (
                  <a
                    href={creator.socialLinks.youtube.startsWith('http') ? creator.socialLinks.youtube : `https://youtube.com/${creator.socialLinks.youtube}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-red-600 font-medium"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube</span>
                  </a>
                )}
              </div>

              {/* Public Stats counters if enabled */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Community Supporters
                  </p>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    {supporterMessages.length}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Public Raised (NGN)
                  </p>
                  <p className="text-xl font-black text-[#F22550] mt-0.5">
                    {creator.publicSettings?.showTotalRaised !== false
                      ? formatCurrency(totalRaised)
                      : 'Private'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Fundraising Campaigns */}
            {campaigns.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>Fundraising Campaigns</span>
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">
                    {campaigns.length} active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campaigns.map((camp) => (
                    <CampaignCard
                      key={camp.id}
                      campaign={camp}
                      creatorUsername={creator.username}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Supporter Message Wall */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#F22550]" />
                  <span>Supporter Wall</span>
                </h3>
                <span className="text-xs text-gray-400">
                  {supporterMessages.length} contributions
                </span>
              </div>
              <SupporterMessageWall messages={supporterMessages} />
            </div>
          </div>

          {/* Right Column: Sticky Support Checkout Box */}
          <div className="lg:col-span-5 sticky top-20">
            <SupportBox
              creator={creator}
              onContributionSuccess={() => {
                loadCreatorData();
              }}
            />
          </div>
        </div>
      </div>

      {/* Report Creator Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Report Creator Page</h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs space-y-1 text-center">
                <p className="font-bold">Report Submitted</p>
                <p>Our Trust & Safety moderators will review this within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200"
                  >
                    <option value="Misleading information">Misleading information or impersonation</option>
                    <option value="Fraud or Scam">Suspected fraud or financial scam</option>
                    <option value="Inappropriate Content">Inappropriate or prohibited content</option>
                    <option value="Other">Other abuse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Details</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Please explain why you are reporting this page..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

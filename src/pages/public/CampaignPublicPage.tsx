import React, { useState, useEffect } from 'react';
import { useParams, Link } from '../../router';
import {
  getCampaignBySlug,
  getCampaignUpdates,
  getCampaignVerifiedProgress,
} from '../../services/campaignService';
import { getCreatorProfileByUsername } from '../../services/creatorService';
import { submitReport } from '../../services/adminService';
import { Campaign, CreatorProfile, CampaignUpdate, Contribution } from '../../types';
import { formatCurrency, calculateProgress, formatDate, timeAgo } from '../../utils/formatters';
import { ContributionCheckoutModal } from '../../components/checkout/ContributionCheckoutModal';
import {
  Users,
  Calendar,
  Share2,
  Check,
  Copy,
  Flag,
  Heart,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  X,
  MessageSquare,
  PauseCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export function CampaignPublicPage() {
  const { username, campaignSlug } = useParams<{ username: string; campaignSlug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [verifiedContributions, setVerifiedContributions] = useState<Contribution[]>([]);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [verifiedBackersCount, setVerifiedBackersCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'updates' | 'backers'>('story');

  // Report modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Misrepresentation of funds');
  const [reportDesc, setReportDesc] = useState('');
  const [reportDone, setReportDone] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const loadData = async () => {
    if (!username || !campaignSlug) return;
    setLoading(true);
    try {
      const [camp, prof] = await Promise.all([
        getCampaignBySlug(username, campaignSlug),
        getCreatorProfileByUsername(username),
      ]);

      if (!camp || !prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCampaign(camp);
      setCreator(prof);

      // Fetch updates and genuine verified progress from the database
      const [campUpdates, verifiedProgress] = await Promise.all([
        getCampaignUpdates(camp.id),
        getCampaignVerifiedProgress(camp.id),
      ]);

      setUpdates(campUpdates);
      setVerifiedContributions(verifiedProgress.contributions);
      // Use verified amount from confirmed backend contributions
      setVerifiedAmount(Math.max(camp.amountRaised || 0, verifiedProgress.verifiedAmount));
      setVerifiedBackersCount(Math.max(camp.contributorCount || 0, verifiedProgress.contributorCount));
    } catch (err) {
      console.error('Error loading campaign page:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [username, campaignSlug]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!campaign) return;
    const text = `Join me in supporting "${campaign.title}" on BuyMeData! Every contribution in NGN helps reach this goal: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!campaign) return;
    const text = `Support "${campaign.title}" by @${username} on @BuyMeData! 🚀\n${window.location.href}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign || !creator) return;
    setReportSubmitting(true);
    try {
      await submitReport({
        reporterId: 'visitor',
        reportedUserId: creator.userId,
        campaignId: campaign.id,
        reason: reportReason,
        description: reportDesc,
      });
      setReportDone(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportDone(false);
        setReportDesc('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#6741D9]/20 border-t-[#6741D9] animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (notFound || !campaign || !creator) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Campaign Not Found</h2>
        <p className="text-sm text-gray-500 mt-1">
          This campaign does not exist or may have been unlisted by the organizer.
        </p>
        <Link
          to={`/${username}`}
          className="mt-6 px-5 py-2.5 bg-[#6741D9] hover:bg-[#5633C4] text-white font-semibold text-xs rounded-xl transition-colors"
        >
          Back to @{username}'s Profile
        </Link>
      </div>
    );
  }

  const progress = calculateProgress(verifiedAmount, campaign.targetAmount);

  let daysRemaining: number | null = null;
  if (campaign.deadline) {
    const diff = new Date(campaign.deadline).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const isPaused = campaign.status === 'paused';
  const isCompleted = campaign.status === 'completed';
  const isDraft = campaign.status === 'draft';
  const canContribute = !isPaused && !isCompleted && !isDraft;

  // Filter messages that have text to show in backer highlights
  const publicMessages = verifiedContributions.filter(
    (c) => c.publicMessage && c.message && c.message.trim().length > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/${creator.username}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#6741D9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to @{creator.username}'s Profile</span>
        </Link>

        {/* Share Dropdown / Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-colors"
            title="Share on WhatsApp"
          >
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShareTwitter}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors"
            title="Share on X / Twitter"
          >
            <span>X (Twitter)</span>
          </button>
          <button
            onClick={copyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
          <button
            onClick={() => setReportModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            title="Report this campaign"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Warning Banners */}
      {isPaused && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <PauseCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Campaign Contributions Paused</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              The organizer has temporarily paused new contributions for this campaign. You can still read the story and view verified milestone updates below.
            </p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900">Campaign Goal Completed & Closed</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              This campaign has concluded its fundraising goal. Thank you to everyone who supported this initiative!
            </p>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3">
          <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Draft Preview</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              This campaign is currently saved as a draft and is not visible on public discovery until published.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Media, Story, Tabs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cover Media */}
          <div className="rounded-3xl overflow-hidden aspect-video w-full bg-gray-100 border border-gray-100 shadow-xs relative">
            <img
              src={
                campaign.coverImage ||
                'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80'
              }
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-white/95 text-gray-900 text-xs font-bold rounded-xl shadow-xs backdrop-blur-xs">
                {campaign.category}
              </span>
              {isPaused && (
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs">
                  Paused
                </span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Title & Organizer Info Bar */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {campaign.title}
            </h1>

            {/* Organizer bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <Link
                to={`/${creator.username}`}
                className="flex items-center gap-3 group"
              >
                <img
                  src={
                    creator.profileImage ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                  }
                  alt={creator.displayName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#6741D9]/20"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#6741D9] transition-colors flex items-center gap-1.5">
                    <span>{creator.displayName}</span>
                    <ShieldCheck className="w-4 h-4 text-[#6741D9]" />
                  </h4>
                  <p className="text-xs text-gray-400">Campaign Organizer • @{creator.username}</p>
                </div>
              </Link>

              <div className="text-right">
                <span className="text-[11px] text-gray-400 font-medium">Launched</span>
                <p className="text-xs font-semibold text-gray-700">{formatDate(campaign.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('story')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'story'
                  ? 'border-[#6741D9] text-[#6741D9]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Story & Purpose
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'updates'
                  ? 'border-[#6741D9] text-[#6741D9]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Milestone Updates</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                {updates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('backers')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'backers'
                  ? 'border-[#6741D9] text-[#6741D9]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Verified Backers</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                {verifiedBackersCount}
              </span>
            </button>
          </div>

          {/* Tab 1: Story & Purpose */}
          {activeTab === 'story' && (
            <div className="space-y-6">
              {/* Summary Callout */}
              <div className="bg-[#F0EBFF]/40 rounded-2xl p-5 border border-[#6741D9]/15">
                <p className="text-sm font-semibold text-[#5633C4] leading-relaxed">
                  "{campaign.summary}"
                </p>
              </div>

              {/* Full Description */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 space-y-4">
                <h3 className="font-extrabold text-base text-gray-900">Campaign Overview & Budget Allocation</h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
                  {campaign.description}
                </div>
              </div>

              {/* Creator Trust & Direct Settlement Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Verified Direct Escrow Settlement</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    100% of verified contributions made in Nigerian Naira (₦) are settled directly to {creator.displayName}'s bank account minus standard platform transaction fees. BuyMeData maintains an immutable double-entry ledger for every contribution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Milestone Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              {updates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-gray-300 mx-auto" />
                  <h4 className="text-sm font-bold text-gray-800">No milestone updates posted yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    The organizer will post progress updates, receipts, and photos as fundraising milestones are met.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((upd, idx) => (
                    <div
                      key={upd.id}
                      className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-xs"
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#F0EBFF] text-[#6741D9] font-bold text-xs flex items-center justify-center">
                            #{updates.length - idx}
                          </span>
                          <h4 className="font-bold text-gray-900 text-base">{upd.title}</h4>
                        </div>
                        <span className="text-[11px] text-gray-400">{formatDate(upd.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line pl-8">
                        {upd.content}
                      </p>
                      {upd.images && upd.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 pt-2 pl-8">
                          {upd.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Milestone evidence"
                              className="rounded-xl w-full h-44 object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Verified Backers */}
          {activeTab === 'backers' && (
            <div className="space-y-4">
              {verifiedContributions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
                  <Users className="w-8 h-8 text-gray-300 mx-auto" />
                  <h4 className="text-sm font-bold text-gray-800">No backers yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Be the very first backer to contribute to this campaign and appear on this wall!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>Showing {verifiedContributions.length} verified contributions</span>
                    <span className="font-semibold text-emerald-700">All payments confirmed</span>
                  </div>

                  {verifiedContributions.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 shadow-xs hover:border-[#6741D9]/20 transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6741D9] to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                            {c.anonymous ? '?' : c.supporterName.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">
                              {c.anonymous ? 'Generous Backer' : c.supporterName}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {timeAgo(c.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-[#6741D9] bg-[#F0EBFF] px-2.5 py-1 rounded-lg">
                            {formatCurrency(c.amount)}
                          </span>
                        </div>
                      </div>

                      {c.publicMessage && c.message && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl italic">
                          "{c.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sticky Contribution Card */}
        <div className="lg:col-span-4 sticky top-20 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-6">
            {/* Amount & Goal */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-[#6741D9]">
                  {formatCurrency(verifiedAmount)}
                </span>
                <span className="text-xs font-bold text-[#6741D9] bg-[#F0EBFF] px-2 py-0.5 rounded-md">
                  {progress}%
                </span>
              </div>
              <p className="text-xs text-gray-500">
                raised of <span className="font-bold text-gray-900">{formatCurrency(campaign.targetAmount)}</span> target
              </p>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6741D9] to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-center">
                <div>
                  <p className="text-xl font-black text-gray-900">{verifiedBackersCount}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Verified Backers</p>
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">
                    {daysRemaining !== null ? daysRemaining : 'Ongoing'}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {daysRemaining !== null ? 'Days Remaining' : 'No Deadline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contribute Action */}
            {canContribute ? (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-4 px-4 bg-[#6741D9] hover:bg-[#5633C4] text-white font-black text-sm rounded-2xl shadow-md shadow-[#6741D9]/25 hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>Back this Campaign</span>
              </button>
            ) : isPaused ? (
              <button
                disabled
                className="w-full py-3.5 px-4 bg-amber-100 text-amber-800 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
              >
                Contributions Paused by Organizer
              </button>
            ) : isCompleted ? (
              <button
                disabled
                className="w-full py-3.5 px-4 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
              >
                Goal Reached (Campaign Closed)
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 px-4 bg-gray-100 text-gray-500 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
              >
                Draft Preview Only
              </button>
            )}

            {/* Social Share Bar */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
                Spread the Word
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>X / Twitter</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 text-center leading-relaxed">
              Transparent crowdfunding • 100% of verified contributions go directly to the organizer.
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <ContributionCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        creator={creator}
        campaign={campaign}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Report Campaign</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportDone ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-medium">
                Thank you. Report submitted for Trust & Safety review.
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                  >
                    <option value="Misrepresentation of funds">Misrepresentation of funds or goals</option>
                    <option value="Fraudulent campaign">Fraudulent campaign</option>
                    <option value="Copyright violation">Copyright or identity infringement</option>
                    <option value="Other">Other policy violation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Details</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the issue with this campaign..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-gray-200 resize-none focus:outline-none focus:border-[#6741D9]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from '../../router';
import { createCampaign, getCampaignById, updateCampaign } from '../../services/campaignService';
import {
  Flame,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  ShieldAlert,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import { slugify, formatCurrency } from '../../utils/formatters';
import { CampaignVisibility, CampaignStatus } from '../../types';

const CAMPAIGN_COVER_PRESETS = [
  {
    name: 'Tech & Solar',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Workplace & Education',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Creative Studio',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Community Hub',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  },
];

const TARGET_PRESETS = [50000, 100000, 250000, 500000, 1000000, 2500000];

export function CampaignEditorPage() {
  const { fbUser, creatorProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isEditing = pathname !== '/dashboard/campaigns/new' && pathname.startsWith('/dashboard/campaigns/');
  const campaignId = isEditing ? pathname.replace('/dashboard/campaigns/', '') : null;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(250000);
  const [category, setCategory] = useState('Technology');
  const [coverImage, setCoverImage] = useState(CAMPAIGN_COVER_PRESETS[0].url);
  const [deadline, setDeadline] = useState('');
  const [visibility, setVisibility] = useState<CampaignVisibility>('public');
  const [status, setStatus] = useState<CampaignStatus>('active');

  const [fetchingCampaign, setFetchingCampaign] = useState(isEditing);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load existing campaign data if editing
  useEffect(() => {
    if (!isEditing || !campaignId) return;

    const loadData = async () => {
      setFetchingCampaign(true);
      try {
        const camp = await getCampaignById(campaignId);
        if (camp) {
          // Ownership verification
          if (fbUser && camp.creatorId !== fbUser.uid) {
            setUnauthorized(true);
            setErrorMsg('Access Denied: You do not have permission to edit this campaign.');
            return;
          }
          setTitle(camp.title || '');
          setSlug(camp.slug || '');
          setSummary(camp.summary || '');
          setDescription(camp.description || '');
          setTargetAmount(camp.targetAmount || 250000);
          setCategory(camp.category || 'Technology');
          setCoverImage(camp.coverImage || CAMPAIGN_COVER_PRESETS[0].url);
          setVisibility(camp.visibility || 'public');
          setStatus(camp.status || 'active');
          if (camp.deadline) {
            setDeadline(camp.deadline.slice(0, 10));
          }
        } else {
          setErrorMsg('Campaign not found.');
        }
      } catch (err) {
        console.error('Error fetching campaign for edit:', err);
        setErrorMsg('Failed to load campaign data.');
      } finally {
        setFetchingCampaign(false);
      }
    };

    loadData();
  }, [isEditing, campaignId, fbUser]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const handleSetDeadlineDays = (days: number | null) => {
    if (days === null) {
      setDeadline('');
    } else {
      const d = new Date(Date.now() + days * 86400000);
      setDeadline(d.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = async (e: React.FormEvent, overrideStatus?: CampaignStatus) => {
    e.preventDefault();
    if (!fbUser) return;
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide a campaign title and detailed description.');
      return;
    }
    if (targetAmount < 5000) {
      setErrorMsg('Minimum campaign target is ₦5,000.');
      return;
    }

    const finalStatus = overrideStatus || status;

    setErrorMsg('');
    setLoading(true);

    try {
      if (isEditing && campaignId) {
        await updateCampaign(campaignId, {
          title,
          summary,
          description,
          targetAmount,
          category,
          coverImage,
          visibility,
          status: finalStatus,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });
        setSuccessMsg('Campaign updated successfully!');
        setTimeout(() => {
          navigate('/dashboard/campaigns');
        }, 1200);
      } else {
        await createCampaign({
          creatorId: fbUser.uid,
          creatorUsername: creatorProfile?.username || fbUser.email?.split('@')[0] || 'creator',
          creatorDisplayName: creatorProfile?.displayName || fbUser.displayName || 'Creator',
          creatorAvatar: creatorProfile?.profileImage,
          title,
          slug: slug || slugify(title),
          summary,
          description,
          coverImage,
          category,
          targetAmount,
          currency: 'NGN',
          status: finalStatus,
          visibility,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        });

        navigate('/dashboard/campaigns');
      }
    } catch (err: unknown) {
      console.error('Failed to save campaign:', err);
      setErrorMsg('Failed to save campaign. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCampaign) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#6741D9]" />
        <p className="text-xs text-gray-500 font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900">Access Denied</h2>
        <p className="text-xs text-gray-500">
          You do not have permission to modify this campaign because you are not its designated organizer.
        </p>
        <Link
          to="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white font-semibold text-xs rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to My Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
        </Link>

        {isEditing && creatorProfile?.username && slug && (
          <a
            href={`/${creatorProfile.username}/campaigns/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#6741D9] hover:underline flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" /> View Public Page
          </a>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500" />
              <span>{isEditing ? 'Edit Fundraising Campaign' : 'Launch a Fundraising Campaign'}</span>
            </h1>
            <p className="text-xs text-gray-500">
              {isEditing
                ? 'Update your campaign story, target amount, or change campaign lifecycle status.'
                : 'Set a clear milestone, transparent cost breakdown, and share the goal with your backers.'}
            </p>
          </div>

          {/* Current Status Pill */}
          {isEditing && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider self-start sm:self-auto ${
                status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'paused'
                  ? 'bg-amber-50 text-amber-700'
                  : status === 'completed'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Status: {status}
            </span>
          )}
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Campaign Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Solar Power & Starlink Setup for Youth Code Camp"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
            />
          </div>

          {/* Target Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Financial Target (NGN ₦) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-gray-400 text-xs">
                  ₦
                </span>
                <input
                  type="number"
                  required
                  min={5000}
                  step={1000}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              {/* Quick Target Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {TARGET_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetAmount(amt)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      targetAmount === amt
                        ? 'bg-[#6741D9] text-white border-[#6741D9]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              >
                <option value="Technology">Technology & Hardware</option>
                <option value="Education">Education & Courses</option>
                <option value="Creative projects">Creative Projects & Media</option>
                <option value="Business">Business & Startups</option>
                <option value="Personal needs">Personal Needs</option>
                <option value="Community projects">Community Projects</option>
                <option value="Emergency support">Emergency Support</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Short summary */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Short Pitch / Summary
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="Brief 1-sentence overview that appears on preview cards"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
            />
          </div>

          {/* Full description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Campaign Story & Detailed Breakdown <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={6}
              placeholder="Explain the background, why funding is critical, and a transparent itemized list of how the money will be spent..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] resize-none"
            />
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Cover Image URL
            </label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Paste image URL (or pick a preset below)"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Themes:</span>
                <div className="flex flex-wrap gap-2">
                  {CAMPAIGN_COVER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCoverImage(p.url)}
                      className={`h-7 px-2.5 text-[11px] font-semibold rounded-lg border transition-all ${
                        coverImage === p.url
                          ? 'border-[#6741D9] bg-[#F0EBFF] text-[#6741D9]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deadline & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign Deadline (optional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleSetDeadlineDays(14)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded text-gray-600 hover:bg-gray-100"
                >
                  +14 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDeadlineDays(30)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded text-gray-600 hover:bg-gray-100"
                >
                  +30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDeadlineDays(60)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-gray-50 border border-gray-200 rounded text-gray-600 hover:bg-gray-100"
                >
                  +60 Days
                </button>
                {deadline && (
                  <button
                    type="button"
                    onClick={() => handleSetDeadlineDays(null)}
                    className="px-2 py-0.5 text-[10px] font-semibold text-rose-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              >
                <option value="public">Public (Shown on your page & featured)</option>
                <option value="unlisted">Unlisted (Accessible only via direct link)</option>
              </select>

              {isEditing && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none font-bold"
                  >
                    <option value="active">Active (Receiving Contributions)</option>
                    <option value="paused">Paused (Temporarily Halting Contributions)</option>
                    <option value="completed">Completed / Closed (Goal Finished)</option>
                    <option value="draft">Draft (Unpublished)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 w-full py-3.5 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Campaign Changes' : 'Publish Campaign Live'}</span>
              )}
            </button>

            {!isEditing && (
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e, 'draft')}
                className="w-full sm:w-auto px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-2xl transition-colors"
              >
                Save as Draft
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

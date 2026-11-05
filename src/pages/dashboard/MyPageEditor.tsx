import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveCreatorProfile, checkUsernameAvailability } from '../../services/creatorService';
import {
  Globe,
  Sparkles,
  Save,
  Check,
  Eye,
  Smartphone,
  Monitor,
  ExternalLink,
  Copy,
  AlertCircle,
  Loader2,
  Heart,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
];

export function MyPageEditor() {
  const { creatorProfile, fbUser, refreshProfiles } = useAuth();

  const [displayName, setDisplayName] = useState(creatorProfile?.displayName || '');
  const [username, setUsername] = useState(creatorProfile?.username || '');
  const [biography, setBiography] = useState(creatorProfile?.biography || '');
  const [category, setCategory] = useState(creatorProfile?.category || 'Creative & Tech');
  const [profileImage, setProfileImage] = useState(
    creatorProfile?.profileImage ||
    AVATAR_PRESETS[0]
  );
  const [coverImage, setCoverImage] = useState(creatorProfile?.coverImage || COVER_PRESETS[0]);
  const [website, setWebsite] = useState(creatorProfile?.website || '');
  const [twitter, setTwitter] = useState(creatorProfile?.socialLinks?.twitter || '');
  const [github, setGithub] = useState(creatorProfile?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(creatorProfile?.socialLinks?.linkedin || '');
  const [instagram, setInstagram] = useState(creatorProfile?.socialLinks?.instagram || '');
  const [youtube, setYoutube] = useState(creatorProfile?.socialLinks?.youtube || '');
  const [supportButtonText, setSupportButtonText] = useState(creatorProfile?.supportButtonText || 'Buy me data 📶');
  const [amounts, setAmounts] = useState<number[]>(creatorProfile?.suggestedAmounts || [500, 1000, 2000, 5000]);
  const [newAmountInput, setNewAmountInput] = useState<string>('');
  const [theme, setTheme] = useState(creatorProfile?.theme || 'violet');
  const [showTotalRaised, setShowTotalRaised] = useState(creatorProfile?.publicSettings?.showTotalRaised !== false);
  const [showSupporterMessages, setShowSupporterMessages] = useState(creatorProfile?.publicSettings?.showSupporterMessages !== false);
  const [allowAnonymous, setAllowAnonymous] = useState(creatorProfile?.publicSettings?.allowAnonymous !== false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser) return;
    setErrorMsg('');
    setSaving(true);

    try {
      // Check username availability if changed
      if (username !== creatorProfile?.username) {
        const isAvail = await checkUsernameAvailability(username, fbUser.uid);
        if (!isAvail) {
          setErrorMsg('Username is already taken by another creator.');
          setSaving(false);
          return;
        }
      }

      await saveCreatorProfile({
        userId: fbUser.uid,
        displayName,
        username,
        biography,
        category,
        profileImage,
        coverImage,
        website,
        socialLinks: {
          twitter,
          github,
          linkedin,
          instagram,
          youtube,
        },
        supportButtonText,
        suggestedAmounts: amounts.filter((a) => a >= 200),
        theme: theme as any,
        publicSettings: {
          showTotalRaised,
          showSupporterCount: true,
          showSupporterMessages,
          allowAnonymous,
        },
        published: true,
      });

      await refreshProfiles();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Error saving profile:', err);
      setErrorMsg('Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAmount = () => {
    const parsed = Number(newAmountInput);
    if (!parsed || parsed < 200) {
      setErrorMsg('Minimum suggested contribution is ₦200.');
      return;
    }
    if (amounts.includes(parsed)) {
      setErrorMsg('This amount already exists in your presets.');
      return;
    }
    setErrorMsg('');
    setAmounts([...amounts, parsed].sort((a, b) => a - b));
    setNewAmountInput('');
  };

  const handleRemoveAmount = (amountToRemove: number) => {
    if (amounts.length <= 1) {
      setErrorMsg('You must have at least one suggested contribution amount.');
      return;
    }
    setErrorMsg('');
    setAmounts(amounts.filter((a) => a !== amountToRemove));
  };

  // Theme styling for simulator
  const themeClasses: Record<string, { banner: string; badge: string; button: string }> = {
    violet: { banner: 'from-[#6741D9] to-indigo-600', badge: 'bg-[#F0EBFF] text-[#6741D9]', button: 'bg-[#6741D9]' },
    emerald: { banner: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-50 text-emerald-700', button: 'bg-emerald-600' },
    amber: { banner: 'from-amber-600 to-orange-600', badge: 'bg-amber-50 text-amber-700', button: 'bg-amber-600' },
    rose: { banner: 'from-rose-600 to-pink-600', badge: 'bg-rose-50 text-rose-700', button: 'bg-rose-600' },
    ocean: { banner: 'from-cyan-600 to-blue-700', badge: 'bg-cyan-50 text-cyan-700', button: 'bg-cyan-600' },
    midnight: { banner: 'from-gray-900 to-slate-800', badge: 'bg-gray-100 text-gray-900', button: 'bg-gray-900' },
  };

  const currentTheme = themeClasses[theme] || themeClasses.violet;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Customize My Public Page
          </h1>
          <p className="text-xs text-gray-500">
            Edit your profile branding, suggested amounts, and preview how supporters view your page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {creatorProfile?.username && (
            <a
              href={`/${creatorProfile.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Profile updated successfully! Live page reflects your latest changes.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Editor on Left, Live Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Identity & Basic Info */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3">
              Creator Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Username (buymedata.com/...)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3.5 py-2 text-xs font-mono font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              >
                <option value="Software & Technology">Software & Technology</option>
                <option value="Creative & Content">Creative & Content</option>
                <option value="Education & Tutoring">Education & Tutoring</option>
                <option value="Writing & Journalism">Writing & Journalism</option>
                <option value="Music & Audio">Music & Audio</option>
                <option value="Community & Non-profit">Community & Non-profit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Biography
              </label>
              <textarea
                rows={3}
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] resize-none"
              />
            </div>
          </div>

          {/* Imagery */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3">
              Imagery & Brand Look
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Profile Avatar URL
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={profileImage}
                    alt="avatar"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 shadow-xs"
                  />
                  <input
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">Presets:</span>
                  <div className="flex gap-2">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileImage(p)}
                        className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all ${
                          profileImage === p ? 'border-[#6741D9] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cover Banner URL
              </label>
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">Presets:</span>
                  <div className="flex gap-2">
                    {COVER_PRESETS.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(c)}
                        className={`h-6 w-11 rounded-md overflow-hidden border-2 transition-all ${
                          coverImage === c ? 'border-[#6741D9] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={c} alt="Cover preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Color Theme Preset
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'violet', label: 'Violet', color: 'bg-[#6741D9]' },
                  { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                  { id: 'amber', label: 'Amber', color: 'bg-amber-600' },
                  { id: 'rose', label: 'Rose', color: 'bg-rose-600' },
                  { id: 'ocean', label: 'Ocean', color: 'bg-cyan-600' },
                  { id: 'midnight', label: 'Dark', color: 'bg-gray-900' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                      theme === t.id ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${t.color}`} />
                    <span className="text-[10px] font-semibold text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3">
              Social Links & Web Presence
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Website / Portfolio
                </label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Twitter / X Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GitHub Profile
                </label>
                <input
                  type="text"
                  placeholder="username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="text"
                  placeholder="in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  YouTube Channel
                </label>
                <input
                  type="text"
                  placeholder="@channel"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>
            </div>
          </div>

          {/* Support Box Customization */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3">
              Support Box Configuration
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support Button CTA Text
              </label>
              <input
                type="text"
                value={supportButtonText}
                onChange={(e) => setSupportButtonText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Suggested Contribution Amounts (₦)
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                Click the 'X' to remove an amount, or enter a new value below (minimum ₦200).
              </p>

              {/* Amount Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {amounts.map((amt) => (
                  <div
                    key={amt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800"
                  >
                    <span>{formatCurrency(amt)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmount(amt)}
                      className="text-gray-400 hover:text-rose-600 transition-colors"
                      title="Remove amount"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Amount Input */}
              <div className="flex gap-2 max-w-xs">
                <input
                  type="number"
                  min={200}
                  step={100}
                  placeholder="e.g. 10000"
                  value={newAmountInput}
                  onChange={(e) => setNewAmountInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
                <button
                  type="button"
                  onClick={handleAddAmount}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Add Preset
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={showTotalRaised}
                  onChange={(e) => setShowTotalRaised(e.target.checked)}
                  className="rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
                />
                <span>Display total public amount raised on my page</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={showSupporterMessages}
                  onChange={(e) => setShowSupporterMessages(e.target.checked)}
                  className="rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
                />
                <span>Display supporter encouragement messages on public wall</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  className="rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
                />
                <span>Allow supporters to contribute anonymously</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-2xl shadow-md shadow-[#6741D9]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving updates...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>

        {/* Live Simulator Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#6741D9]" /> Live Supporter Preview
            </span>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1 rounded text-xs transition-colors ${
                  previewDevice === 'desktop' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-500'
                }`}
                title="Desktop preview"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1 rounded text-xs transition-colors ${
                  previewDevice === 'mobile' ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-500'
                }`}
                title="Mobile preview"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mockup Screen */}
          <div className={`bg-white rounded-3xl border border-gray-200/80 shadow-lg overflow-hidden mx-auto transition-all ${
            previewDevice === 'mobile' ? 'max-w-xs' : 'max-w-sm'
          }`}>
            {/* Header banner */}
            <div className="h-24 relative overflow-hidden bg-gray-200">
              {coverImage ? (
                <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${currentTheme.banner}`} />
              )}
            </div>

            {/* Content preview */}
            <div className="p-5 -mt-10 relative space-y-4">
              <div className="flex items-end justify-between">
                <img
                  src={profileImage}
                  alt="avatar"
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-sm bg-white"
                />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTheme.badge}`}>
                  {category}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-900 text-base">{displayName || 'Creator Name'}</h4>
                <p className="text-[11px] text-gray-400 font-medium">@{username || 'handle'}</p>
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {biography || 'Short description will appear here.'}
                </p>
              </div>

              {/* Support button preview */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Preset Amounts
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {amounts.slice(0, 4).map((amt, i) => (
                    <div
                      key={i}
                      className="py-1.5 text-center font-bold text-[10px] bg-white border border-gray-200 rounded-lg text-gray-700"
                    >
                      {formatCurrency(amt)}
                    </div>
                  ))}
                </div>
                <div className={`py-2.5 text-center text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs ${currentTheme.button}`}>
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>{supportButtonText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

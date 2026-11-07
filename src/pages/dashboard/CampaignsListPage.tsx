import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '../../router';
import {
  getCreatorCampaigns,
  updateCampaign,
  setCampaignStatus,
  deleteCampaign,
  addCampaignUpdate,
  getCampaignUpdates,
  deleteCampaignUpdate,
} from '../../services/campaignService';
import { Campaign, CampaignStatus, CampaignUpdate } from '../../types';
import { formatCurrency, calculateProgress, formatDate } from '../../utils/formatters';
import {
  PlusCircle,
  Flame,
  ExternalLink,
  Edit,
  Play,
  Pause,
  CheckCircle,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Eye,
} from 'lucide-react';

export function CampaignsListPage() {
  const { fbUser, creatorProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all');

  // Update modal
  const [updateModalCamp, setUpdateModalCamp] = useState<Campaign | null>(null);
  const [campaignUpdatesList, setCampaignUpdatesList] = useState<CampaignUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [updateImage, setUpdateImage] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Delete modal
  const [deletingCamp, setDeletingCamp] = useState<Campaign | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const loadCampaigns = async () => {
    if (!fbUser) return;
    setLoading(true);
    try {
      const camps = await getCreatorCampaigns(fbUser.uid);
      setCampaigns(camps);
    } catch (err) {
      console.error('Error fetching creator campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [fbUser]);

  const handleStatusChange = async (camp: Campaign, newStatus: CampaignStatus) => {
    try {
      await setCampaignStatus(camp.id, newStatus);
      await loadCampaigns();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleOpenUpdatesModal = async (camp: Campaign) => {
    setUpdateModalCamp(camp);
    setLoadingUpdates(true);
    setUpdateSuccess('');
    try {
      const list = await getCampaignUpdates(camp.id);
      setCampaignUpdatesList(list);
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalCamp || !fbUser) return;
    setPostingUpdate(true);
    try {
      const created = await addCampaignUpdate(
        updateModalCamp.id,
        fbUser.uid,
        updateTitle,
        updateContent,
        updateImage ? [updateImage] : []
      );
      setCampaignUpdatesList([created, ...campaignUpdatesList]);
      setUpdateTitle('');
      setUpdateContent('');
      setUpdateImage('');
      setUpdateSuccess('Milestone update published live to backers!');
      setTimeout(() => setUpdateSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to post update:', err);
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      await deleteCampaignUpdate(updateId);
      setCampaignUpdatesList(campaignUpdatesList.filter((u) => u.id !== updateId));
    } catch (err) {
      console.error('Failed to delete update:', err);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!deletingCamp) return;
    setDeletingLoading(true);
    try {
      await deleteCampaign(deletingCamp.id);
      setDeletingCamp(null);
      await loadCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    } finally {
      setDeletingLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Fundraising Campaigns
          </h1>
          <p className="text-xs text-gray-500">
            Create milestone-driven goals, post backer updates, and track verified contribution progress.
          </p>
        </div>

        <Link
          to="/dashboard/campaigns/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Campaign</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search campaigns by title, category, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="paused">Paused Only</option>
            <option value="completed">Completed Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid / List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#F22550]" />
          <p className="text-xs text-gray-400">Loading your campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-lg">
              {searchTerm || statusFilter !== 'all' ? 'No matching campaigns' : 'No campaigns created yet'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try clearing your search keyword or changing status filter.'
                : 'Launch a dedicated crowdfunding campaign for hardware, education, community events, or creative goals.'}
            </p>
          </div>
          <Link
            to="/dashboard/campaigns/new"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#F22550] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch First Campaign</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const progress = calculateProgress(camp.amountRaised, camp.targetAmount);
            const publicUrl = `/${camp.creatorUsername || creatorProfile?.username}/campaigns/${camp.slug}`;

            return (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all hover:border-gray-200"
              >
                {/* Media & Details */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={
                      camp.coverImage ||
                      'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={camp.title}
                    className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                        {camp.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          camp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'completed'
                            ? 'bg-blue-50 text-blue-700'
                            : camp.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {camp.status.toUpperCase()}
                      </span>
                      {camp.visibility === 'unlisted' && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          Unlisted
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                      {camp.title}
                    </h3>

                    {/* Progress track */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#F22550]">
                          {formatCurrency(camp.amountRaised)}
                        </span>
                        <span className="text-gray-400">
                          {progress}% of {formatCurrency(camp.targetAmount)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#F22550] to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <Users className="w-3.5 h-3.5 text-[#F22550]" /> {camp.contributorCount || 0} verified backers
                      </span>
                      {camp.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Deadline: {formatDate(camp.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="flex flex-wrap md:flex-col items-center gap-2 w-full md:w-auto">
                  <Link
                    to={`/dashboard/campaigns/${camp.id}`}
                    className="flex-1 md:w-40 py-2 px-3 text-center text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                    <span>Edit Details</span>
                  </Link>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 md:w-40 py-2 px-3 text-center text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleOpenUpdatesModal(camp)}
                    className="flex-1 md:w-40 py-2 px-3 text-center text-xs font-semibold text-[#F22550] bg-[#FFE6EA] hover:bg-[#FFCCD5] rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Milestone Updates</span>
                  </button>

                  {/* Status lifecycle actions */}
                  {camp.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(camp, 'active')}
                      className="flex-1 md:w-40 py-2 px-3 text-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Publish Live</span>
                    </button>
                  )}

                  {camp.status === 'active' && (
                    <div className="flex gap-1.5 w-full md:w-40">
                      <button
                        onClick={() => handleStatusChange(camp, 'paused')}
                        className="flex-1 py-2 px-2 text-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Pause contributions temporarily"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(camp, 'completed')}
                        className="flex-1 py-2 px-2 text-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Mark campaign completed & closed"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Close</span>
                      </button>
                    </div>
                  )}

                  {camp.status === 'paused' && (
                    <div className="flex gap-1.5 w-full md:w-40">
                      <button
                        onClick={() => handleStatusChange(camp, 'active')}
                        className="flex-1 py-2 px-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(camp, 'completed')}
                        className="flex-1 py-2 px-2 text-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Close</span>
                      </button>
                    </div>
                  )}

                  {camp.status === 'completed' && (
                    <button
                      onClick={() => handleStatusChange(camp, 'active')}
                      className="flex-1 md:w-40 py-2 px-3 text-center text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Re-open</span>
                    </button>
                  )}

                  {/* Deletion (for drafts or empty campaigns) */}
                  {(camp.status === 'draft' || (camp.amountRaised === 0 && camp.contributorCount === 0)) && (
                    <button
                      onClick={() => setDeletingCamp(camp)}
                      className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Campaign Update Modal */}
      {updateModalCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Campaign Milestone Updates</h3>
                <p className="text-xs text-gray-400 truncate max-w-sm">{updateModalCamp.title}</p>
              </div>
              <button
                onClick={() => setUpdateModalCamp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}

            {/* Post New Update Form */}
            <form onSubmit={handlePostUpdate} className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/70">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                Post New Progress Announcement
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Batteries arrived in Lagos! Testing inverter setup"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Detailed Update <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share progress photos, milestones achieved, and next steps with your backers..."
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] resize-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Photo URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={updateImage}
                  onChange={(e) => setUpdateImage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={postingUpdate}
                className="w-full py-2.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {postingUpdate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Update to Public Page</span>
                )}
              </button>
            </form>

            {/* List of Previous Updates */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                Published Updates ({campaignUpdatesList.length})
              </h4>

              {loadingUpdates ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#F22550] mx-auto" />
                </div>
              ) : campaignUpdatesList.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No milestone updates posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {campaignUpdatesList.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 bg-white rounded-xl border border-gray-100 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900">{u.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{formatDate(u.createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(u.id)}
                            className="text-gray-400 hover:text-rose-600 transition-colors"
                            title="Delete update"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                        {u.content}
                      </p>
                      {u.images && u.images.length > 0 && (
                        <div className="flex gap-2 pt-1 overflow-x-auto">
                          {u.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Update media"
                              className="h-16 w-24 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Campaign Confirmation Dialog */}
      {deletingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-gray-900">Delete Campaign?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete <span className="font-bold text-gray-800">"{deletingCamp.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCamp(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={confirmDeleteCampaign}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {deletingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

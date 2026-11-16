import React, { useState, useEffect } from 'react';
import { Link } from '../../router';
import { getPublicCreators } from '../../services/creatorService';
import { getPublicCampaigns } from '../../services/campaignService';
import { CreatorProfile, Campaign } from '../../types';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { Search, ArrowRight, Users, Target, Sparkles, Compass } from 'lucide-react';

export function ExplorePage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'pages'>('all');

  useEffect(() => {
    let mounted = true;
    Promise.all([getPublicCreators(24), getPublicCampaigns()])
      .then(([creatorList, campaignList]) => {
        if (!mounted) return;
        setCreators(creatorList);
        setCampaigns(campaignList);
      })
      .catch((err) => console.warn('Explore load notice:', err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const query = searchQuery.trim().toLowerCase();

  const filteredCreators = creators.filter((c) => {
    if (!query) return true;
    return (
      c.displayName.toLowerCase().includes(query) ||
      c.username.toLowerCase().includes(query) ||
      (c.biography || '').toLowerCase().includes(query) ||
      (c.category || '').toLowerCase().includes(query)
    );
  });

  const filteredCampaigns = campaigns.filter((cmp) => {
    if (!query) return true;
    return (
      cmp.title.toLowerCase().includes(query) ||
      (cmp.summary || '').toLowerCase().includes(query) ||
      (cmp.category || '').toLowerCase().includes(query) ||
      (cmp.creatorUsername || '').toLowerCase().includes(query)
    );
  });

  const showGoals = activeTab === 'all' || activeTab === 'goals';
  const showPages = activeTab === 'all' || activeTab === 'pages';
  const hasResults =
    (showGoals && filteredCampaigns.length > 0) ||
    (showPages && filteredCreators.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F22550]">
          Discover & Support
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
          Explore pages and fundraising goals.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Find creators, builders, students, and community initiatives to support directly in Naira.
        </p>
      </div>

      {/* Controls: Search & Tab Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, @username, or goal..."
            aria-label="Search creators and fundraising goals"
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm text-[#17191F] placeholder-gray-400 focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Filter explore results">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'goals' as const, label: `Fundraising Goals (${filteredCampaigns.length})` },
            { id: 'pages' as const, label: `Support Pages (${filteredCreators.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#17191F] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="h-36 bg-gray-100 rounded-xl" />
              <div className="h-5 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && hasResults && (
        <div className="space-y-14">
          {showGoals && filteredCampaigns.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-[#F22550]" />
                  <h2 className="text-xl font-extrabold text-[#17191F]">Active Fundraising Goals</h2>
                </div>
                <span className="text-xs font-semibold text-gray-500 tabular-nums">
                  {filteredCampaigns.length} active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    campaign={camp}
                    creatorUsername={camp.creatorUsername}
                  />
                ))}
              </div>
            </section>
          )}

          {showPages && filteredCreators.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-[#F22550]" />
                  <h2 className="text-xl font-extrabold text-[#17191F]">Published Support Pages</h2>
                </div>
                <span className="text-xs font-semibold text-gray-500 tabular-nums">
                  {filteredCreators.length} pages
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => {
                  const initials = creator.displayName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() || '')
                    .join('') || 'B';

                  return (
                    <Link
                      key={creator.id}
                      to={`/@${creator.username}`}
                      className="bg-white rounded-2xl border border-gray-200/80 p-6 hover:border-[#F22550]/40 hover:shadow-sm transition-all flex flex-col justify-between gap-5 group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-3.5">
                          {creator.profileImage ? (
                            <img
                              src={creator.profileImage}
                              alt={creator.displayName}
                              className="w-12 h-12 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#FFE6EA] text-[#F22550] font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-[#17191F] text-base truncate group-hover:text-[#F22550] transition-colors">
                              {creator.displayName}
                            </h3>
                            <p className="text-xs font-medium text-gray-500 truncate">
                              buymedata.com/@{creator.username}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {creator.biography || 'Receiving direct support and sharing updates on BuyMeData.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-500">{creator.category || 'Creator & Builder'}</span>
                        <span className="font-bold text-[#F22550] inline-flex items-center gap-1">
                          Visit page <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Honest Empty State */}
      {!loading && !hasResults && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#17191F]">
              {query ? `No matches for "${searchQuery}"` : 'No published pages or goals listed yet'}
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {query
                ? 'Try clearing your search filter or check back as more creators, students, and community initiatives publish their pages.'
                : 'Be among the first to publish your personal BuyMeData page or launch a fundraising goal for your supporters.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
              >
                Clear search
              </button>
            )}
            <Link
              to="/auth/register"
              className="px-6 py-3 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <span>Create your free page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

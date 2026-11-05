import React from 'react';
import { Campaign } from '../../types';
import { formatCurrency, calculateProgress } from '../../utils/formatters';
import { Link } from '../../router';
import { Calendar, Users, ArrowRight } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  creatorUsername: string;
}

export function CampaignCard({ campaign, creatorUsername }: CampaignCardProps) {
  const progress = calculateProgress(campaign.amountRaised, campaign.targetAmount);

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (campaign.deadline) {
    const diff = new Date(campaign.deadline).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const campaignUrl = `/${creatorUsername}/campaigns/${campaign.slug}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
      {/* Cover image */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
        <img
          src={
            campaign.coverImage ||
            'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80'
          }
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/95 text-gray-800 rounded-lg shadow-sm backdrop-blur-xs">
            {campaign.category}
          </span>
          {campaign.status === 'paused' && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500 text-white rounded-md shadow-xs">
              Paused
            </span>
          )}
          {campaign.status === 'completed' && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 text-white rounded-md shadow-xs">
              Completed
            </span>
          )}
          {campaign.status === 'draft' && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-gray-600 text-white rounded-md shadow-xs">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link to={campaignUrl}>
            <h4 className="font-bold text-gray-900 group-hover:text-[#6741D9] transition-colors line-clamp-2 text-base">
              {campaign.title}
            </h4>
          </Link>
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            {campaign.summary}
          </p>
        </div>

        {/* Progress bar and stats */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-sm text-[#6741D9]">
              {formatCurrency(campaign.amountRaised)}
            </span>
            <span className="text-gray-400">
              goal of {formatCurrency(campaign.targetAmount)}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6741D9] to-[#8C68FF] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
            <span className="font-semibold text-gray-700">{progress}% funded</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                {campaign.contributorCount || 0} backers
              </span>
              {daysRemaining !== null && (
                <span className="flex items-center gap-1 text-amber-700">
                  <Calendar className="w-3 h-3" />
                  {daysRemaining}d left
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Link */}
        <Link
          to={campaignUrl}
          className="w-full py-2 px-3 text-center text-xs font-bold text-[#6741D9] bg-[#F0EBFF] hover:bg-[#E5DBFF] rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <span>View Campaign</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

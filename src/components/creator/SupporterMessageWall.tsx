import React, { useState } from 'react';
import { Contribution } from '../../types';
import { formatCurrency, timeAgo } from '../../utils/formatters';
import { Heart, MessageSquare, Flame, Filter } from 'lucide-react';

interface SupporterMessageWallProps {
  messages: Contribution[];
}

export function SupporterMessageWall({ messages }: SupporterMessageWallProps) {
  const [filter, setFilter] = useState<'all' | 'with_message'>('all');

  const filtered = messages.filter((c) => {
    if (filter === 'with_message') {
      return Boolean(c.message && c.message.trim().length > 0);
    }
    return true;
  });

  const countWithMessage = messages.filter((c) => c.message && c.message.trim().length > 0).length;

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#F0EBFF] text-[#6741D9] flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-gray-800 text-sm">Be the first to show support</h4>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Send a contribution and leave a personalized message of encouragement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 bg-gray-50'
          }`}
        >
          All Contributions ({messages.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('with_message')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
            filter === 'with_message'
              ? 'bg-[#6741D9] text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-900 bg-gray-50'
          }`}
        >
          With Messages ({countWithMessage})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          No supporters left written messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2 transition-all hover:border-gray-200 shadow-xs"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6741D9] to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                    {c.anonymous ? '?' : (c.supporterName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900">
                        {c.anonymous ? 'Generous Supporter' : c.supporterName}
                      </span>
                      {c.campaignTitle && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[140px]">{c.campaignTitle}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 text-[11px]">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-xs text-[#6741D9] bg-[#F0EBFF] px-2.5 py-1 rounded-lg">
                  {formatCurrency(c.amount)}
                </span>
              </div>

              {c.message && (
                <p className="text-xs text-gray-700 pl-10.5 leading-relaxed italic">
                  "{c.message}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

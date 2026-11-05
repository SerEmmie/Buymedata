import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllReports, resolveReport } from '../../services/adminService';
import { Report } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Flag, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';

export function AdminReportsPage() {
  const { fbUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const list = await getAllReports();
      setReports(list);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (reportId: string, actionNote: string) => {
    if (!fbUser) return;
    setActionLoading(reportId);
    try {
      await resolveReport(fbUser.uid, reportId, actionNote);
      await loadReports();
    } catch (err) {
      console.error('Error resolving report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Flag className="w-6 h-6 text-amber-600" />
          <span>Trust & Safety Moderation Reports</span>
        </h1>
        <p className="text-xs text-gray-500">
          Community reports regarding campaigns, content safety, and suspected policy violations.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No moderation abuse reports submitted.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((r) => (
              <div key={r.id} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                      {r.reason}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  "{r.description}"
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>Reported UID: {r.reportedUserId} {r.campaignId && `(Campaign: ${r.campaignId})`}</span>

                  {r.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResolve(r.id, 'Investigation closed: No violation')}
                        disabled={actionLoading === r.id}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolve(r.id, 'Reviewed and creator notified')}
                        disabled={actionLoading === r.id}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg"
                      >
                        Resolve & Mark Safe
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

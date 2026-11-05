import React, { useState, useEffect } from 'react';
import { getAdminAuditLogs } from '../../services/adminService';
import { AdminAuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { FileText, Shield, Loader2 } from 'lucide-react';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAuditLogs()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-amber-600" />
          <span>Administrative Audit Trail</span>
        </h1>
        <p className="text-xs text-gray-500">
          Immutable log of all moderation, payout approvals, suspension actions, and platform setting edits.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No administrative audit actions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Action</th>
                  <th className="p-4">Administrator UID</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Reason / Notes</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-gray-500 truncate max-w-[120px]">
                      {l.administratorId}
                    </td>
                    <td className="p-4 text-gray-700">
                      {l.entityType} ({l.entityId})
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">
                      {l.reason || 'Routine action'}
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap text-[11px]">
                      {formatDateTime(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

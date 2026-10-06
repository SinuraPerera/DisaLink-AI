import React, { useState } from 'react';
import { LedgerEntry, UILanguage } from '../types';
import { ChainVerificationResult } from '../lib/ledger';
import { tr } from '../lib/i18n';
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  Flame,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface LedgerScreenProps {
  lang?: UILanguage;
  entries: LedgerEntry[];
  verification: ChainVerificationResult;
  onVerifyChain: () => Promise<void>;
  onTamperRandomRecord: () => Promise<LedgerEntry | null>;
  onResetDemo: () => Promise<void>;
}

export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  lang = 'en',
  entries,
  verification,
  onVerifyChain,
  onTamperRandomRecord,
  onResetDemo,
}) => {
  const [tamperNotice, setTamperNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<
    'all' | 'ai' | 'human' | 'system'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleExportSignedLedger = () => {
    const bundle = {
      exportedAt: new Date().toISOString(),
      algorithm: 'SHA-256 (Web Crypto API)',
      chainValid: verification.valid,
      totalRecords: entries.length,
      headHash: entries[entries.length - 1]?.hash || '0',
      entries,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disalink-sha256-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTamperClick = async () => {
    const mutated = await onTamperRandomRecord();
    if (mutated) {
      setTamperNotice(
        tr(
          lang,
          `Injected integrity test fault on entry #${mutated.seq} (${mutated.id}) without recomputing its SHA-256 hash. Click "Verify chain" to confirm cryptographic tamper detection.`,
          `SHA-256 හැෂ් අගය නැවත ගණනය නොකර #${mutated.seq} (${mutated.id}) සටහනට පරීක්ෂණ වෙනස්කමක් ඇතුළත් කරන ලදී. වෙනස්කම් හඳුනා ගැනීම තහවුරු කිරීමට "දාමය පරීක්ෂා කරන්න" ක්ලික් කරන්න.`,
          `SHA-256 ஹாஷை மீண்டும் கணக்கிடாமல் பதிவு #${mutated.seq} (${mutated.id}) இல் சோதனை மாற்றம் செய்யப்பட்டது. மாற்றத்தைக் கண்டறிய "சங்கிலியைச் சரிபார்" என்பதைக் கிளிக் செய்க.`
        )
      );
    }
  };

  const handleVerifyClick = async () => {
    setTamperNotice(null);
    await onVerifyChain();
  };

  const filteredEntries = entries.filter((e) => {
    if (actorFilter === 'ai' && !e.actor.toLowerCase().includes('gemini'))
      return false;
    if (
      actorFilter === 'human' &&
      !e.actor.toLowerCase().includes('coordinator')
    )
      return false;
    if (
      actorFilter === 'system' &&
      !e.actor.toLowerCase().includes('system') &&
      !e.actor.toLowerCase().includes('offline')
    )
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.summary.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q) ||
        e.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {tr(
              lang,
              'Tamper-Evident Decision Ledger (Web Crypto SHA-256 Hash Chain)',
              'වෙනස් කළ නොහැකි තීරණ ලෙජරය (Web Crypto SHA-256 හැෂ් දාමය)',
              'மாற்றம் கண்டறியும் முடிவுப் பதிவேடு (Web Crypto SHA-256 ஹாஷ் சங்கிலி)'
            )}
          </h1>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'Every AI suggestion and human coordinator action is chained with ',
              'සෑම AI යෝජනාවක් සහ මිනිස් සම්බන්ධීකාරක තීරණයක්ම ',
              'ஒவ்வொரு AI பரிந்துரையும் மனித ஒருங்கிணைப்பாளர் நடவடிக்கையும் '
            )}
            <span className="font-mono">
              hash = SHA256(prevHash + canonicalJSON(record))
            </span>
            {tr(
              lang,
              '. Genesis record uses ',
              ' මගින් දාමගත කර ඇත. ආරම්භක සටහන ',
              ' மூலம் இணைக்கப்பட்டுள்ளது. தொடக்கப் பதிவு '
            )}
            <span className="font-mono">prevHash = "0"</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleVerifyClick}
            className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082054] transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {tr(lang, 'Verify chain', 'දාමය පරීක්ෂා කරන්න', 'சங்கிலியைச் சரிபார்')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportSignedLedger}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>
              {tr(
                lang,
                'Export Ledger (.json)',
                'ලෙජරය බාගන්න (.json)',
                'பதிவேட்டை பதிவிறக்கு (.json)'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={handleTamperClick}
            className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            <Flame className="h-4 w-4 text-red-600" />
            <span>
              {tr(
                lang,
                'Run Tamper Audit Test',
                'වෙනස්කම් පරීක්ෂාව ක්‍රියාත්මක කරන්න',
                'மாற்றச் சோதனையை இயக்கு'
              )}
            </span>
          </button>

          {!verification.valid && (
            <button
              type="button"
              onClick={async () => {
                setTamperNotice(null);
                await onResetDemo();
              }}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {tr(
                  lang,
                  'Restore Intact Chain',
                  'මුල් දාමය ප්‍රතිසාධනය කරන්න',
                  'அசல் சங்கிலியை மீட்டமை'
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Verification Status Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
          verification.valid
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-red-300 bg-red-50 text-red-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {verification.valid ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold">
              {verification.valid
                ? tr(
                    lang,
                    `Chain intact — All ${entries.length} records verified against SHA-256`,
                    `දාමය සුරක්ෂිතයි — සියලුම සටහන් ${entries.length} SHA-256 මගින් තහවුරු කරන ලදී`,
                    `சங்கிலி பாதுகாப்பானது — அனைத்து ${entries.length} பதிவுகளும் SHA-256 மூலம் சரிபார்க்கப்பட்டன`
                  )
                : tr(
                    lang,
                    `Tampered at entry #${verification.tamperedIndex} (${verification.tamperedEntryId})`,
                    `#${verification.tamperedIndex} (${verification.tamperedEntryId}) සටහන වෙනස් කර ඇත`,
                    `பதிவு #${verification.tamperedIndex} (${verification.tamperedEntryId}) மாற்றப்பட்டுள்ளது`
                  )}
            </div>
            <div className="mt-0.5 text-xs break-all">
              {verification.valid
                ? `${tr(lang, 'Head hash:', 'ප්‍රධාන හැෂ් අගය:', 'முதன்மை ஹாஷ்:')} ${entries[entries.length - 1]?.hash || '0'}`
                : verification.reason}
            </div>
          </div>
        </div>

        <span className="font-mono text-xs font-semibold">
          {verification.valid
            ? tr(lang, 'VERIFIED OK', 'තහවුරු කරන ලදී', 'சரிபார்க்கப்பட்டது')
            : tr(lang, 'INTEGRITY FAILURE', 'අඛණ්ඩතා දෝෂයකි', 'நேர்மை தோல்வி')}
        </span>
      </div>

      {tamperNotice && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
          <span>{tamperNotice}</span>
        </div>
      )}

      {/* Actor Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActorFilter('all')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              actorFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr(
              lang,
              `All Records (${entries.length})`,
              `සියලුම සටහන් (${entries.length})`,
              `அனைத்துப் பதிவுகளும் (${entries.length})`
            )}
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('human')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              actorFilter === 'human'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr(
              lang,
              'Human Coordinator Decisions',
              'මිනිස් සම්බන්ධීකාරක තීරණ',
              'மனித ஒருங்கிணைப்பாளர் முடிவுகள்'
            )}
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('ai')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              actorFilter === 'ai'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr(lang, 'AI Suggestions', 'AI යෝජනා', 'AI பரிந்துரைகள்')}
          </button>
          <button
            type="button"
            onClick={() => setActorFilter('system')}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              actorFilter === 'system'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tr(
              lang,
              'Rule Engine & Offline Sync',
              'ආරක්ෂක රීති සහ Offline සමමුහුර්තකරණය',
              'பாதுகாப்பு விதி & ஆஃப்லைன் ஒத்திசைவு'
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr(
              lang,
              'Search Case ID, Report ID, hash...',
              'සිදුවීම් අංකය, වාර්තා අංකය, හැෂ් සොයන්න...',
              'நிகழ்வு எண், அறிக்கை எண், ஹாஷ் தேடு...'
            )}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none sm:w-56"
          />
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="space-y-2.5 md:hidden">
        {filteredEntries.map((entry) => {
          const isTamperedRow =
            !verification.valid && verification.tamperedIndex === entry.seq;
          const isExpanded = expandedId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className={`cursor-pointer rounded-lg border p-3.5 text-xs space-y-2 ${
                isTamperedRow
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                <span className="font-bold text-slate-900">
                  #{entry.seq} · {entry.type}
                </span>
                <span className="text-slate-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="font-medium text-[#0B2A6F]">{entry.actor}</div>
              <p className="text-slate-700 leading-relaxed">{entry.summary}</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-mono text-[10px] text-slate-500">
                <span>
                  prev:{' '}
                  {entry.prevHash === '0'
                    ? '0 (GENESIS)'
                    : `${entry.prevHash.slice(0, 8)}...`}
                </span>
                <span className="font-semibold text-slate-800">
                  hash: {entry.hash.slice(0, 10)}...
                </span>
              </div>

              {isExpanded && (
                <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10px]">
                  <div className="break-all">
                    <strong>prevHash:</strong> {entry.prevHash}
                  </div>
                  <div className="break-all">
                    <strong>hash:</strong> {entry.hash}
                  </div>
                  <pre className="overflow-x-auto rounded bg-white p-2">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Ledger Table (md+) */}
      <div className="hidden md:block rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 pl-4 pr-2 font-medium">#</th>
                <th className="py-2.5 px-2.5 font-medium">
                  {tr(lang, 'Timestamp', 'වේලාව', 'நேரம்')}
                </th>
                <th className="py-2.5 px-2.5 font-medium">
                  {tr(lang, 'Actor', 'ක්‍රියාකරු', 'செயல்பவர்')}
                </th>
                <th className="py-2.5 px-2.5 font-medium">
                  {tr(lang, 'Action Type', 'ක්‍රියා වර්ගය', 'செயல் வகை')}
                </th>
                <th className="py-2.5 px-2.5 font-medium">
                  {tr(lang, 'Payload Summary', 'සාරාංශය', 'சுருக்கம்')}
                </th>
                <th className="py-2.5 px-2.5 font-medium">
                  {tr(lang, 'Prev Hash', 'පෙර හැෂ්', 'முந்தைய ஹாஷ்')}
                </th>
                <th className="py-2.5 pl-2.5 pr-4 font-medium">
                  {tr(lang, 'SHA-256 Hash', 'SHA-256 හැෂ්', 'SHA-256 ஹாஷ்')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const isTamperedRow =
                  !verification.valid &&
                  verification.tamperedIndex === entry.seq;
                const isExpanded = expandedId === entry.id;

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                      className={`cursor-pointer transition-colors ${
                        isTamperedRow
                          ? 'bg-red-100/80 hover:bg-red-100'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 pl-4 pr-2 font-mono font-semibold text-slate-800 tabular-nums">
                        #{entry.seq}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-2.5 font-medium text-slate-800 whitespace-nowrap">
                        {entry.actor}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-[#0B2A6F] whitespace-nowrap">
                        {entry.type}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-700 max-w-md">
                        {entry.summary}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-500 tabular-nums">
                        {entry.prevHash === '0'
                          ? '0 (GENESIS)'
                          : `${entry.prevHash.slice(0, 10)}...`}
                      </td>
                      <td className="py-2.5 pl-2.5 pr-4 font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                        {entry.hash.slice(0, 12)}...
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid grid-cols-1 gap-2 font-mono text-[11px] text-slate-700 md:grid-cols-2">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {tr(
                                  lang,
                                  `Full Cryptographic Links (${entry.id}):`,
                                  `සම්පූර්ණ ගුප්තකේතන සබැඳි (${entry.id}):`,
                                  `முழு கிரிப்டோகிராஃபிக் இணைப்புகள் (${entry.id}):`
                                )}
                              </div>
                              <div className="mt-1 break-all">
                                prevHash: {entry.prevHash}
                              </div>
                              <div className="mt-1 break-all">
                                hash: {entry.hash}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">
                                {tr(
                                  lang,
                                  'Canonical Payload JSON:',
                                  'සම්මත දත්ත ව්‍යුහය (JSON):',
                                  'தரப்படுத்தப்பட்ட தரவு (JSON):'
                                )}
                              </div>
                              <pre className="mt-1 overflow-x-auto rounded border border-slate-200 bg-white p-2 text-[11px]">
                                {JSON.stringify(entry.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

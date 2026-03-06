import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Save, Send, Plus, Trash2, Clock, Globe, BookOpen,
  ChevronDown, ChevronUp, Check, X, AlertCircle, Loader2,
} from 'lucide-react';
import { emailService } from '../services';
import type { EmailConfig, EmailConfigUpdate, StoryEmail, StoryEmailListResponse } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const TIMEZONE_OPTIONS = [
  'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Taipei', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

const EmailPage: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [formData, setFormData] = useState<EmailConfigUpdate>({});
  const [history, setHistory] = useState<StoryEmailListResponse | null>(null);
  const [expandedEmailId, setExpandedEmailId] = useState<number | null>(null);

  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 10;

  // ==================== Data Fetching ====================

  const fetchConfig = useCallback(async () => {
    try {
      const data = await emailService.getConfig();
      setConfig(data);
      setFormData({
        is_active: data.is_active,
        timezone: data.timezone,
        send_times: data.send_times,
        words_per_email: data.words_per_email,
        extra_recipients: data.extra_recipients,
        story_language: data.story_language,
        exclude_word_ids: data.exclude_word_ids,
      });
    } catch (err) {
      console.error('Failed to fetch email config:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await emailService.getHistory({
        skip: (historyPage - 1) * historyPageSize,
        limit: historyPageSize,
      });
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch email history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyPage]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ==================== Handlers ====================

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const data = await emailService.updateConfig(formData);
      setConfig(data);
      setSaveMessage({ type: 'success', text: 'Configuration saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async () => {
    setIsSendingTest(true);
    setSaveMessage(null);
    try {
      await emailService.sendTestEmail();
      setSaveMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
      setTimeout(() => setSaveMessage(null), 5000);
      fetchHistory();
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to send test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const addTimeSlot = () => {
    const current = formData.send_times || [];
    if (current.length < 10) {
      setFormData({ ...formData, send_times: [...current, '09:00'] });
    }
  };

  const removeTimeSlot = (index: number) => {
    const current = [...(formData.send_times || [])];
    current.splice(index, 1);
    setFormData({ ...formData, send_times: current });
  };

  const updateTimeSlot = (index: number, value: string) => {
    const current = [...(formData.send_times || [])];
    current[index] = value;
    setFormData({ ...formData, send_times: current });
  };

  const addExtraRecipient = () => {
    const current = formData.extra_recipients || [];
    if (current.length < 3) {
      setFormData({ ...formData, extra_recipients: [...current, ''] });
    }
  };

  const removeExtraRecipient = (index: number) => {
    const current = [...(formData.extra_recipients || [])];
    current.splice(index, 1);
    setFormData({ ...formData, extra_recipients: current });
  };

  const updateExtraRecipient = (index: number, value: string) => {
    const current = [...(formData.extra_recipients || [])];
    current[index] = value;
    setFormData({ ...formData, extra_recipients: current });
  };

  const addExcludeId = (idStr: string) => {
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      const current = formData.exclude_word_ids || [];
      if (!current.includes(id)) {
        setFormData({ ...formData, exclude_word_ids: [...current, id] });
      }
    }
  };

  const removeExcludeId = (id: number) => {
    const current = (formData.exclude_word_ids || []).filter(x => x !== id);
    setFormData({ ...formData, exclude_word_ids: current });
  };

  // ==================== Render ====================

  if (isLoadingConfig) {
    return <LoadingSpinner />;
  }

  const totalHistoryPages = history ? Math.ceil(history.total / historyPageSize) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
          <Mail className="text-primary-400" size={28} />
          Story Emails
        </h1>
        <p className="mt-1 text-dark-400 text-sm">
          Configure periodic vocabulary story emails to reinforce your learning.
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          saveMessage.type === 'success'
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {saveMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {saveMessage.text}
        </div>
      )}

      {/* Configuration Panel */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Schedule Configuration</h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active ?? false}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-dark-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 peer-checked:after:bg-white"></div>
            <span className="ms-3 text-sm text-dark-300">
              {formData.is_active ? 'Active' : 'Inactive'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Send Times */}
          <div className="space-y-3">
            <label className="label flex items-center gap-2">
              <Clock size={14} />
              Send Times ({(formData.send_times || []).length} per day)
            </label>
            <div className="space-y-2">
              {(formData.send_times || []).map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTimeSlot(i, e.target.value)}
                    className="input flex-1"
                  />
                  <button onClick={() => removeTimeSlot(i)} className="p-2 text-dark-400 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addTimeSlot} className="btn btn-ghost text-xs flex items-center gap-1">
              <Plus size={14} /> Add Time Slot
            </button>
          </div>

          {/* Timezone */}
          <div className="space-y-3">
            <label className="label flex items-center gap-2">
              <Globe size={14} />
              Timezone
            </label>
            <select
              value={formData.timezone || 'Asia/Shanghai'}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="input w-full"
            >
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>

            {/* Words Per Email */}
            <label className="label flex items-center gap-2 mt-4">
              <BookOpen size={14} />
              Words Per Email
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={formData.words_per_email ?? 3}
              onChange={(e) => setFormData({ ...formData, words_per_email: parseInt(e.target.value, 10) || 3 })}
              className="input w-full"
            />

            {/* Story Language */}
            <label className="label mt-4">Story Language</label>
            <div className="flex gap-4">
              {(['english', 'bilingual'] as const).map(lang => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="story_language"
                    value={lang}
                    checked={formData.story_language === lang}
                    onChange={() => setFormData({ ...formData, story_language: lang })}
                    className="text-primary-500 focus:ring-primary-500 bg-dark-700 border-dark-600"
                  />
                  <span className="text-sm text-dark-200 capitalize">
                    {lang === 'bilingual' ? 'Bilingual (EN + CN)' : 'English'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-3">
          <label className="label">Recipients</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-lg border border-dark-700">
            <Mail size={14} className="text-primary-400" />
            <span className="text-sm text-dark-300">{config?.user_email}</span>
            <span className="text-xs text-dark-500 ml-auto">Primary (your account email)</span>
          </div>
          {(formData.extra_recipients || []).map((email, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={email}
                onChange={(e) => updateExtraRecipient(i, e.target.value)}
                placeholder="extra-recipient@example.com"
                className="input flex-1"
              />
              <button onClick={() => removeExtraRecipient(i)} className="p-2 text-dark-400 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {(formData.extra_recipients || []).length < 3 && (
            <button onClick={addExtraRecipient} className="btn btn-ghost text-xs flex items-center gap-1">
              <Plus size={14} /> Add Recipient (max 3)
            </button>
          )}
        </div>

        {/* Excluded Word IDs */}
        <div className="space-y-3">
          <label className="label">Excluded Word IDs</label>
          <div className="flex flex-wrap gap-2">
            {(formData.exclude_word_ids || []).map(id => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-dark-800 border border-dark-700 rounded-full text-sm text-dark-200"
              >
                #{id}
                <button onClick={() => removeExcludeId(id)} className="text-dark-400 hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              type="number"
              placeholder="Add ID"
              className="input w-24 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addExcludeId((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
          <p className="text-xs text-dark-500">Press Enter to add a word ID to the exclusion list.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-dark-800">
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary flex items-center gap-2">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Configuration
          </button>
          <button onClick={handleTestSend} disabled={isSendingTest} className="btn btn-secondary flex items-center gap-2">
            {isSendingTest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Test Email
          </button>
        </div>
      </div>

      {/* Email History */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Email History</h2>

        {isLoadingHistory ? (
          <LoadingSpinner />
        ) : !history || history.emails.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Mail size={40} className="mx-auto mb-3 opacity-50" />
            <p>No emails sent yet. Try sending a test email!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.emails.map(email => (
              <EmailCard
                key={email.id}
                email={email}
                isExpanded={expandedEmailId === email.id}
                onToggle={() => setExpandedEmailId(expandedEmailId === email.id ? null : email.id)}
              />
            ))}

            {totalHistoryPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={historyPage}
                  totalPages={totalHistoryPages}
                  totalItems={history?.total || 0}
                  pageSize={historyPageSize}
                  onPageChange={setHistoryPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== Email Card Component ====================

interface EmailCardProps {
  email: StoryEmail;
  isExpanded: boolean;
  onToggle: () => void;
}

const EmailCard: React.FC<EmailCardProps> = ({ email, isExpanded, onToggle }) => {
  const statusColors = {
    sent: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-750 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[email.status]}`}>
            {email.status}
          </span>
          <span className="text-sm text-white truncate">{email.subject}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-dark-400">
            {new Date(email.sent_at).toLocaleString()}
          </span>
          {isExpanded ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-dark-700 pt-4">
          {/* Word Snapshots */}
          <div>
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Words</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {email.word_snapshots.map((w, i) => (
                <div key={i} className="px-3 py-2 bg-dark-900 rounded-lg">
                  <p className="text-sm font-medium text-primary-400">{w.title}</p>
                  <p className="text-xs text-dark-300 mt-0.5 line-clamp-2">{w.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Story Content */}
          <div>
            <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">Story</h4>
            <div
              className="text-sm text-dark-200 leading-relaxed bg-dark-900 p-4 rounded-lg prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: email.story_content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-400">$1</strong>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          </div>

          {/* Recipients */}
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <Mail size={12} />
            <span>Sent to: {email.recipient_emails.join(', ')}</span>
          </div>

          {email.error_message && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/5 p-3 rounded-lg">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{email.error_message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailPage;

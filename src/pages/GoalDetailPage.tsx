import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Tag as TagIcon, Calendar } from 'lucide-react';
import { goalsService, tagsService } from '../services';
import type { Goal, GoalUpdate, Tag } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { AxiosError } from 'axios';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-dark-600' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface FormState {
  title: string;
  description: string;
  notes: string;
  status: string;
  priority: string;
  urgency: string;
  tagIds: number[];
}

const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    title: '', description: '', notes: '', status: 'not_started', priority: 'medium', urgency: 'medium', tagIds: [],
  });
  const [originalData, setOriginalData] = useState<FormState>({
    title: '', description: '', notes: '', status: 'not_started', priority: 'medium', urgency: 'medium', tagIds: [],
  });

  const initFormFromGoal = (g: Goal, allTags: Tag[]) => {
    const tagIds = allTags.filter(t => g.tags.includes(t.name)).map(t => t.id).sort();
    const state: FormState = {
      title: g.title,
      description: g.description || '',
      notes: g.notes || '',
      status: g.status,
      priority: g.priority,
      urgency: g.urgency,
      tagIds,
    };
    setFormData(state);
    setOriginalData(state);
  };

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [goalData, tagsResponse] = await Promise.all([
        goalsService.getById(parseInt(id)),
        tagsService.getAll({ tag_type: 'goals' }),
      ]);
      setGoal(goalData);
      setTags(tagsResponse.tags);
      initFormFromGoal(goalData, tagsResponse.tags);
    } catch {
      navigate('/dashboard/goals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const hasChanges = useMemo(() => {
    return (
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.notes !== originalData.notes ||
      formData.status !== originalData.status ||
      formData.priority !== originalData.priority ||
      formData.urgency !== originalData.urgency ||
      JSON.stringify([...formData.tagIds].sort()) !== JSON.stringify([...originalData.tagIds].sort())
    );
  }, [formData, originalData]);

  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize(descriptionRef.current);
    autoResize(notesRef.current);
  }, [formData.description, formData.notes, autoResize]);

  const handleSave = async () => {
    if (!goal || !hasChanges) return;
    setError('');
    setIsSaving(true);
    try {
      const updateData: GoalUpdate = {
        title: formData.title,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        priority: formData.priority,
        urgency: formData.urgency,
        tags: formData.tagIds,
      };
      const updated = await goalsService.update(goal.id, updateData);
      setGoal(updated);
      initFormFromGoal(updated, tags);
      setSaveSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    setIsSubmitting(true);
    try {
      await goalsService.delete(goal.id);
      navigate('/dashboard/goals');
    } catch {
      console.error('Failed to delete goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId],
    }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (!goal) return <div className="text-center py-12"><p className="text-dark-400">Goal not found</p></div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/dashboard/goals')} className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Goals
        </button>
        <div className="flex items-center gap-2">
          {saveSuccess && <span className="text-sm text-emerald-400 mr-2">Saved!</span>}
          <button onClick={handleSave} disabled={!hasChanges || isSaving} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? <span className="spinner" /> : <><Save size={18} /> Save</>}
          </button>
          <button onClick={() => setIsDeleteOpen(true)} className="btn-danger">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Editable form */}
      <div className="card space-y-6">
        {/* Title */}
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="input text-lg font-semibold"
            placeholder="Goal title"
            required
          />
        </div>

        {/* Status / Priority / Urgency */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Status</label>
            <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="input">
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))} className="input">
              {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Urgency</label>
            <select value={formData.urgency} onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))} className="input">
              {URGENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            ref={descriptionRef}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input min-h-[40px] resize-none overflow-hidden"
            placeholder="Describe your goal"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            ref={notesRef}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="input min-h-[40px] resize-none overflow-hidden"
            placeholder="Additional notes"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="label">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  formData.tagIds.includes(tag.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                <TagIcon size={14} />
                {tag.name}
              </button>
            ))}
            {tags.length === 0 && <p className="text-sm text-dark-500">No tags available.</p>}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-dark-400 pt-4 border-t border-dark-800">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            Created {new Date(goal.created_time).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete "${goal.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default GoalDetailPage;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Save, Tag as TagIcon, Calendar, Link as LinkIcon } from 'lucide-react';
import { tasksService, tagsService, goalsService } from '../services';
import type { Task, TaskUpdate, Tag, Goal } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { AxiosError } from 'axios';

const STATUS_OPTIONS = [
  { value: 'not_done', label: 'Not Done', color: 'bg-dark-600' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
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
  name: string;
  description: string;
  goal_id: number | undefined;
  status: string;
  priority: string;
  urgency: string;
  tagIds: number[];
}

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    name: '', description: '', goal_id: undefined, status: 'not_done', priority: 'medium', urgency: 'medium', tagIds: [],
  });
  const [originalData, setOriginalData] = useState<FormState>({
    name: '', description: '', goal_id: undefined, status: 'not_done', priority: 'medium', urgency: 'medium', tagIds: [],
  });

  const initFormFromTask = (t: Task, allTags: Tag[]) => {
    const tagIds = allTags.filter(tag => t.tags.includes(tag.name)).map(tag => tag.id).sort();
    const state: FormState = {
      name: t.name,
      description: t.description || '',
      goal_id: t.goal_id || undefined,
      status: t.status,
      priority: t.priority,
      urgency: t.urgency,
      tagIds,
    };
    setFormData(state);
    setOriginalData(state);
  };

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [taskData, tagsResponse, goalsResponse] = await Promise.all([
        tasksService.getById(parseInt(id)),
        tagsService.getAll({ tag_type: 'goals' }),
        goalsService.getAll(),
      ]);
      setTask(taskData);
      setTags(tagsResponse.tags);
      setGoals(goalsResponse.goals);
      initFormFromTask(taskData, tagsResponse.tags);
    } catch {
      navigate('/dashboard/tasks');
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
      formData.name !== originalData.name ||
      formData.description !== originalData.description ||
      (formData.goal_id || 0) !== (originalData.goal_id || 0) ||
      formData.status !== originalData.status ||
      formData.priority !== originalData.priority ||
      formData.urgency !== originalData.urgency ||
      JSON.stringify([...formData.tagIds].sort()) !== JSON.stringify([...originalData.tagIds].sort())
    );
  }, [formData, originalData]);

  const handleSave = async () => {
    if (!task || !hasChanges) return;
    setError('');
    setIsSaving(true);
    try {
      const updateData: TaskUpdate = {
        name: formData.name,
        description: formData.description || undefined,
        goal_id: formData.goal_id || 0,
        status: formData.status,
        priority: formData.priority,
        urgency: formData.urgency,
        tags: formData.tagIds,
      };
      const updated = await tasksService.update(task.id, updateData);
      setTask(updated);
      initFormFromTask(updated, tags);
      setSaveSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsSubmitting(true);
    try {
      await tasksService.delete(task.id);
      navigate('/dashboard/tasks');
    } catch {
      console.error('Failed to delete task');
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
  if (!task) return <div className="text-center py-12"><p className="text-dark-400">Task not found</p></div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/dashboard/tasks')} className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Tasks
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
        {/* Name */}
        <div>
          <label className="label">Task Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input text-lg font-semibold"
            placeholder="Task name"
            required
          />
        </div>

        {/* Link to Goal */}
        <div>
          <label className="label"><LinkIcon size={14} className="inline mr-1" />Link to Goal</label>
          <select
            value={formData.goal_id || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, goal_id: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="input"
          >
            <option value="">No linked goal</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
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
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input min-h-[120px] resize-y"
            placeholder="Describe your task"
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
            Created {new Date(task.created_time).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.name}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TaskDetailPage;

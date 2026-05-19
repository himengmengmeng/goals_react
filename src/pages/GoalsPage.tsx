import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Target, Tag as TagIcon, Filter, Search } from 'lucide-react';
import { goalsService, tagsService } from '../services';
import type { Goal, GoalCreate, Tag } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import MultiSelectFilter from '../components/MultiSelectFilter';
import { AxiosError } from 'axios';
import clsx from 'clsx';

const PAGE_SIZE = 10;

// 与 Django Goal.STATUS_CHOICES 一致；界面文案仍用 Completed / On Hold
const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'bg-dark-600' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'blocked', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'resolved', label: 'Completed', color: 'bg-green-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-dark-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/** 旧前端曾用 completed / on_hold；后端存 blocked / resolved */
function canonicalGoalStatus(status: string): string {
  if (status === 'completed') return 'resolved';
  if (status === 'on_hold') return 'blocked';
  return status;
}

const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<GoalCreate>({
    title: '',
    description: '',
    notes: '',
    status: 'not_started',
    priority: 'medium',
    urgency: 'medium',
    tags: [],
  });

  // Fetch goals
  const fetchGoals = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await goalsService.getAll({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter.length ? statusFilter : undefined,
        priority: priorityFilter.length ? priorityFilter : undefined,
        tag_id: tagFilter.length ? tagFilter : undefined,
        skip,
        limit: PAGE_SIZE,
      });
      setGoals(response.goals);
      setTotalItems(response.total);
      setTotalPages(Math.ceil(response.total / PAGE_SIZE));
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, tagFilter, currentPage]);

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await tagsService.getAll({ tag_type: 'goals' });
      setTags(response.tags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchGoals(currentPage);
  }, [currentPage, fetchGoals]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
    fetchGoals(1);
  }, [debouncedSearch, statusFilter, priorityFilter, tagFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openCreateForm = () => {
    setSelectedGoal(null);
    setFormData({
      title: '',
      description: '',
      notes: '',
      status: 'not_started',
      priority: 'medium',
      urgency: 'medium',
      tags: [],
    });
    setError('');
    setIsFormOpen(true);
  };

  const openDeleteDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await goalsService.create(formData);
      setIsFormOpen(false);
      fetchGoals(currentPage);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;
    setIsSubmitting(true);

    try {
      await goalsService.delete(selectedGoal.id);
      setIsDeleteOpen(false);
      fetchGoals(currentPage);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...(prev.tags || []), tagId],
    }));
  };

  const getStatusStyle = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === canonicalGoalStatus(status));
    return option?.color || 'bg-dark-600';
  };

  const getPriorityStyle = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(o => o.value === priority);
    return option?.color || 'text-dark-400';
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display text-white mb-1">Goals</h1>
          <p className="text-dark-400">Track and manage your personal goals</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          <Plus size={20} />
          Add Goal
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals by title, description, notes..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter size={18} className="text-dark-400" />
        <MultiSelectFilter
          label="Status"
          options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          selected={statusFilter}
          onChange={setStatusFilter}
          minWidth="160px"
        />
        <MultiSelectFilter
          label="Priority"
          options={PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
          selected={priorityFilter}
          onChange={setPriorityFilter}
          minWidth="160px"
        />
        <MultiSelectFilter
          label="Tags"
          options={tags.map(t => ({ value: t.id, label: t.name }))}
          selected={tagFilter}
          onChange={setTagFilter}
          minWidth="160px"
        />
      </div>

      {/* Goals list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Start by creating your first goal to track your progress."
          action={{ label: 'Add Goal', onClick: openCreateForm }}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className="card hover:border-dark-700 transition-all duration-200 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/dashboard/goals/${goal.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx('w-2.5 h-2.5 rounded-full', getStatusStyle(goal.status))} />
                      <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="text-dark-300 mb-3 ml-5">{goal.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 ml-5">
                      <span className={clsx('text-sm font-medium', getPriorityStyle(goal.priority))}>
                        {PRIORITY_OPTIONS.find(o => o.value === goal.priority)?.label} Priority
                      </span>
                      <span className="text-sm text-dark-400">
                        {STATUS_OPTIONS.find(o => o.value === canonicalGoalStatus(goal.status))?.label}
                      </span>
                      {goal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {goal.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-500/10 text-primary-400 text-xs font-medium rounded-full"
                            >
                              <TagIcon size={12} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteDialog(goal); }}
                      className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add New Goal"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="label">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input"
              placeholder="Enter goal title"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input min-h-[100px] resize-y"
              placeholder="Describe your goal"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="input"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="input"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                className="input"
              >
                {URGENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input min-h-[80px] resize-y"
              placeholder="Additional notes"
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    formData.tags?.includes(tag.id)
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-dark-500">No tags available. Create tags first.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <span className="spinner" /> : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete "${selectedGoal?.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default GoalsPage;

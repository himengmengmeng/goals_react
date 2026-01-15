import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Tag as TagIcon, Target, CheckSquare } from 'lucide-react';
import { tagsService } from '../services';
import type { Tag, TagCreate, TagUpdate } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { AxiosError } from 'axios';

const GoalTagsPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<TagCreate>({
    name: '',
    tag_type: 'goals',
  });

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await tagsService.getAll({ tag_type: 'goals', search: search || undefined });
      setTags(response.tags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTags();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchTags]);

  const openCreateForm = () => {
    setSelectedTag(null);
    setFormData({ name: '', tag_type: 'goals' });
    setError('');
    setIsFormOpen(true);
  };

  const openEditForm = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({ name: tag.name, tag_type: 'goals' });
    setError('');
    setIsFormOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (selectedTag) {
        // Update
        const updateData: TagUpdate = { name: formData.name };
        await tagsService.update(selectedTag.id, updateData, 'goals');
      } else {
        // Create
        await tagsService.create(formData);
      }
      setIsFormOpen(false);
      fetchTags();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTag) return;
    setIsSubmitting(true);

    try {
      await tagsService.delete(selectedTag.id, 'goals');
      setIsDeleteOpen(false);
      fetchTags();
    } catch (err) {
      console.error('Failed to delete tag:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display text-white mb-1">Goal Tags</h1>
          <p className="text-dark-400">Organize your goals and tasks with tags</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          <Plus size={20} />
          Add Tag
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="input pl-12"
        />
      </div>

      {/* Tags list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No tags yet"
          description="Create tags to organize and categorize your goals and tasks."
          action={{ label: 'Add Tag', onClick: openCreateForm }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag, index) => (
            <div
              key={tag.id}
              className="card hover:border-dark-700 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                      <TagIcon className="w-5 h-5 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate">{tag.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span className="inline-flex items-center gap-1">
                      <Target size={14} />
                      {tag.goal_count} goals
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare size={14} />
                      {tag.task_count} tasks
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(tag)}
                    className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(tag)}
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
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTag ? 'Edit Tag' : 'Add New Tag'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="label">
              Tag Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              placeholder="Enter tag name"
              required
            />
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
              {isSubmitting ? <span className="spinner" /> : selectedTag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete "${selectedTag?.name}"? This will not delete the goals or tasks associated with this tag.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default GoalTagsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, BookOpen, Tag as TagIcon, Eye } from 'lucide-react';
import { wordsService, tagsService } from '../services';
import type { Word, WordCreate, WordUpdate, Tag } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { AxiosError } from 'axios';

const PAGE_SIZE = 10;

const WordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<WordCreate>({
    title: '',
    explanation: '',
    notes: '',
    tags: [],
  });

  // Fetch words
  const fetchWords = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const response = await wordsService.getAll({ 
        search: search || undefined,
        skip,
        limit: PAGE_SIZE,
      });
      setWords(response.words);
      setTotalItems(response.total);
      setTotalPages(Math.ceil(response.total / PAGE_SIZE));
    } catch (err) {
      console.error('Failed to fetch words:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, currentPage]);

  // Fetch tags for dropdown
  const fetchTags = async () => {
    try {
      const response = await tagsService.getAll({ tag_type: 'words' });
      setTags(response.tags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchWords(currentPage);
  }, [currentPage, fetchWords]);

  // Debounced search - reset to page 1 when searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchWords(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openCreateForm = () => {
    setSelectedWord(null);
    setFormData({ title: '', explanation: '', notes: '', tags: [] });
    setError('');
    setIsFormOpen(true);
  };

  const openEditForm = (word: Word) => {
    setSelectedWord(word);
    const tagIds = tags.filter(t => word.tags.includes(t.name)).map(t => t.id);
    setFormData({
      title: word.title,
      explanation: word.explanation,
      notes: word.notes || '',
      tags: tagIds,
    });
    setError('');
    setIsFormOpen(true);
  };

  const openDeleteDialog = (word: Word) => {
    setSelectedWord(word);
    setIsDeleteOpen(true);
  };

  const viewWordDetail = (word: Word) => {
    navigate(`/dashboard/words/${word.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (selectedWord) {
        // Update
        const updateData: WordUpdate = {
          title: formData.title,
          explanation: formData.explanation,
          notes: formData.notes || undefined,
          tags: formData.tags,
        };
        await wordsService.update(selectedWord.id, updateData);
      } else {
        // Create
        await wordsService.create(formData);
      }
      setIsFormOpen(false);
      fetchWords(currentPage);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWord) return;
    setIsSubmitting(true);

    try {
      await wordsService.delete(selectedWord.id);
      setIsDeleteOpen(false);
      fetchWords(currentPage);
    } catch (err) {
      console.error('Failed to delete word:', err);
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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display text-white mb-1">English Words</h1>
          <p className="text-dark-400">Manage your vocabulary collection</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          <Plus size={20} />
          Add Word
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words, explanations, notes..."
          className="input pl-12"
        />
      </div>

      {/* Words list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : words.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No words yet"
          description="Start building your vocabulary by adding your first word."
          action={{ label: 'Add Word', onClick: openCreateForm }}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {words.map((word, index) => (
              <div
                key={word.id}
                className="card hover:border-dark-700 transition-all duration-200 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => viewWordDetail(word)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">{word.title}</h3>
                    <p className="text-dark-300 mb-3 line-clamp-2">{word.explanation}</p>
                    {word.notes && (
                      <p className="text-sm text-dark-400 italic mb-3 line-clamp-1">"{word.notes}"</p>
                    )}
                    {word.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {word.tags.map((tag) => (
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
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => viewWordDetail(word)}
                      className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => openEditForm(word)}
                      className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(word)}
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
        title={selectedWord ? 'Edit Word' : 'Add New Word'}
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
              Word <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input"
              placeholder="Enter the word"
              required
            />
          </div>

          <div>
            <label className="label">
              Explanation <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              className="input min-h-[100px] resize-y"
              placeholder="Enter the explanation or definition"
              required
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input min-h-[80px] resize-y"
              placeholder="Add personal notes, example sentences, etc."
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
              {isSubmitting ? <span className="spinner" /> : selectedWord ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Word"
        message={`Are you sure you want to delete "${selectedWord?.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default WordsPage;

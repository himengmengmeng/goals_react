import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, Trash2, Upload, X, Tag as TagIcon, 
  Calendar, Image, FileText, Film, Download, CheckCircle, Eye
} from 'lucide-react';
import { wordsService, tagsService } from '../services';
import type { Word, WordUpdate, Tag, MediaFileInfo } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8001';

const WordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [word, setWord] = useState<Word | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteMediaOpen, setIsDeleteMediaOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFileInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFileInfo | null>(null);

  const [formData, setFormData] = useState<WordUpdate>({
    title: '',
    explanation: '',
    notes: '',
    tags: [],
  });

  // Fetch word details
  const fetchWord = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await wordsService.getById(parseInt(id));
      setWord(data);
    } catch (err) {
      console.error('Failed to fetch word:', err);
      navigate('/dashboard/words');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tags for edit form
  const fetchTags = async () => {
    try {
      const response = await tagsService.getAll({ tag_type: 'words' });
      setTags(response.tags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  useEffect(() => {
    fetchWord();
    fetchTags();
  }, [id]);

  // Auto-hide upload success message
  useEffect(() => {
    if (uploadSuccess) {
      const timer = setTimeout(() => setUploadSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  const openEditForm = () => {
    if (!word) return;
    const tagIds = tags.filter(t => word.tags.includes(t.name)).map(t => t.id);
    setFormData({
      title: word.title,
      explanation: word.explanation,
      notes: word.notes || '',
      tags: tagIds,
    });
    setError('');
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word) return;
    setError('');
    setIsSubmitting(true);

    try {
      await wordsService.update(word.id, formData);
      setIsEditOpen(false);
      fetchWord();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!word) return;
    setIsSubmitting(true);

    try {
      await wordsService.delete(word.id);
      navigate('/dashboard/words');
    } catch (err) {
      console.error('Failed to delete word:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!word || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploadError('');
    setUploadSuccess(false);
    setIsUploading(true);

    try {
      await wordsService.uploadMedia(word.id, file);
      setUploadSuccess(true);
      fetchWord();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setUploadError(axiosError.response?.data?.detail || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openDeleteMediaDialog = (media: MediaFileInfo) => {
    setSelectedMedia(media);
    setIsDeleteMediaOpen(true);
  };

  const handleDeleteMedia = async () => {
    if (!word || !selectedMedia) return;
    setIsSubmitting(true);

    try {
      await wordsService.deleteMedia(word.id, selectedMedia.id);
      setIsDeleteMediaOpen(false);
      setSelectedMedia(null);
      fetchWord();
    } catch (err) {
      console.error('Failed to delete media:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPreview = (media: MediaFileInfo) => {
    setPreviewMedia(media);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (media: MediaFileInfo) => {
    const fullUrl = getFullMediaUrl(media.file_url);
    
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(fullUrl, '_blank');
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

  const getMediaIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
      return <Image size={24} />;
    }
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) {
      return <Film size={24} />;
    }
    return <FileText size={24} />;
  };

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  };

  const isVideo = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext || '');
  };

  const getFullMediaUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!word) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Word not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard/words')}
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Words
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={openEditForm}
            className="btn-secondary"
          >
            <Edit2 size={18} />
            Edit
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="btn-danger"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Word content */}
      <div className="card mb-8">
        {/* Title */}
        <h1 className="text-3xl font-display text-white mb-4">{word.title}</h1>

        {/* Tags */}
        {word.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {word.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-500/10 text-primary-400 text-sm font-medium rounded-full"
              >
                <TagIcon size={14} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Explanation - larger display */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            Explanation
          </h2>
          <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
            <p className="text-lg text-dark-100 leading-relaxed whitespace-pre-wrap">
              {word.explanation}
            </p>
          </div>
        </div>

        {/* Notes - always show section */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-dark-400 uppercase tracking-wider mb-3">
            Notes
          </h2>
          {word.notes ? (
            <div className="bg-dark-800/30 rounded-xl p-5 border border-dark-700/50">
              <p className="text-dark-300 whitespace-pre-wrap">
                {word.notes}
              </p>
            </div>
          ) : (
            <div className="bg-dark-800/20 rounded-xl p-5 border border-dark-700/30 border-dashed">
              <p className="text-dark-500 italic">No notes added yet</p>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-dark-400 pt-4 border-t border-dark-800">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(word.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Media Files Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-white">Media Files</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn-primary"
            >
              {isUploading ? (
                <span className="spinner" />
              ) : (
                <>
                  <Upload size={18} />
                  Upload File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload success message */}
        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400 text-sm">File uploaded successfully!</p>
          </div>
        )}

        {/* Upload error message */}
        {uploadError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{uploadError}</p>
          </div>
        )}

        {word.media_files.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-dark-700 rounded-xl">
            <Upload className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400 mb-2">No media files yet</p>
            <p className="text-sm text-dark-500">
              Upload images, videos, or documents to enhance your vocabulary
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {word.media_files.map((media) => {
              const fullUrl = getFullMediaUrl(media.file_url);
              return (
                <div
                  key={media.id}
                  className="group relative bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-dark-600 transition-colors"
                >
                  {isImage(media.file_url) ? (
                    <img
                      src={fullUrl}
                      alt={media.filename}
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => openPreview(media)}
                    />
                  ) : isVideo(media.file_url) ? (
                    <video
                      src={fullUrl}
                      className="w-full h-40 object-cover"
                      controls
                    />
                  ) : (
                    <div 
                      className="w-full h-40 flex flex-col items-center justify-center bg-dark-800 cursor-pointer"
                      onClick={() => openPreview(media)}
                    >
                      {getMediaIcon(media.file_url)}
                      <span className="text-sm text-dark-400 mt-2 px-2 text-center truncate max-w-full">
                        {media.filename}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-dark-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openPreview(media)}
                      className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => handleDownload(media)}
                      className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => openDeleteMediaDialog(media)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X size={18} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewMedia(null);
        }}
        title={previewMedia?.filename || 'Preview'}
        size="4xl"
      >
        {previewMedia && (
          <div className="flex flex-col items-center">
            {isImage(previewMedia.file_url) ? (
              <img
                src={getFullMediaUrl(previewMedia.file_url)}
                alt={previewMedia.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : isVideo(previewMedia.file_url) ? (
              <video
                src={getFullMediaUrl(previewMedia.file_url)}
                className="max-w-full max-h-[70vh] rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <div className="text-center py-12">
                {getMediaIcon(previewMedia.file_url)}
                <p className="text-dark-300 mt-4 mb-2">{previewMedia.filename}</p>
                <p className="text-sm text-dark-500 mb-6">
                  This file type cannot be previewed directly
                </p>
                <button
                  onClick={() => handleDownload(previewMedia)}
                  className="btn-primary"
                >
                  <Download size={18} />
                  Download File
                </button>
              </div>
            )}
            
            {/* Download button for images and videos */}
            {(isImage(previewMedia.file_url) || isVideo(previewMedia.file_url)) && (
              <button
                onClick={() => handleDownload(previewMedia)}
                className="btn-secondary mt-4"
              >
                <Download size={18} />
                Download
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Word"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-5">
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
              className="input min-h-[150px] resize-y"
              placeholder="Enter the explanation or definition"
              required
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input min-h-[100px] resize-y"
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
              onClick={() => setIsEditOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? <span className="spinner" /> : 'Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Word Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Word"
        message={`Are you sure you want to delete "${word.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />

      {/* Delete Media Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteMediaOpen}
        onClose={() => {
          setIsDeleteMediaOpen(false);
          setSelectedMedia(null);
        }}
        onConfirm={handleDeleteMedia}
        title="Delete Media"
        message={`Are you sure you want to delete "${selectedMedia?.filename}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default WordDetailPage;

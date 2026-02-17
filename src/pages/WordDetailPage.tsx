import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Upload, X, Tag as TagIcon, Save,
  Calendar, Image, FileText, Film, Download, CheckCircle, Eye
} from 'lucide-react';
import { wordsService, tagsService } from '../services';
import type { Word, WordUpdate, Tag, MediaFileInfo } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8001';

interface FormState {
  title: string;
  explanation: string;
  notes: string;
  tagIds: number[];
}

const WordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [word, setWord] = useState<Word | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteMediaOpen, setIsDeleteMediaOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFileInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFileInfo | null>(null);

  const [formData, setFormData] = useState<FormState>({ title: '', explanation: '', notes: '', tagIds: [] });
  const [originalData, setOriginalData] = useState<FormState>({ title: '', explanation: '', notes: '', tagIds: [] });

  const initFormFromWord = (w: Word, allTags: Tag[]) => {
    const tagIds = allTags.filter(t => w.tags.includes(t.name)).map(t => t.id).sort();
    const state: FormState = { title: w.title, explanation: w.explanation, notes: w.notes || '', tagIds };
    setFormData(state);
    setOriginalData(state);
  };

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [wordData, tagsResponse] = await Promise.all([
        wordsService.getById(parseInt(id)),
        tagsService.getAll({ tag_type: 'words' }),
      ]);
      setWord(wordData);
      setTags(tagsResponse.tags);
      initFormFromWord(wordData, tagsResponse.tags);
    } catch {
      navigate('/dashboard/words');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useEffect(() => {
    if (uploadSuccess) { const t = setTimeout(() => setUploadSuccess(false), 3000); return () => clearTimeout(t); }
  }, [uploadSuccess]);

  useEffect(() => {
    if (saveSuccess) { const t = setTimeout(() => setSaveSuccess(false), 2000); return () => clearTimeout(t); }
  }, [saveSuccess]);

  const hasChanges = useMemo(() => {
    return (
      formData.title !== originalData.title ||
      formData.explanation !== originalData.explanation ||
      formData.notes !== originalData.notes ||
      JSON.stringify([...formData.tagIds].sort()) !== JSON.stringify([...originalData.tagIds].sort())
    );
  }, [formData, originalData]);

  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize(explanationRef.current);
    autoResize(notesRef.current);
  }, [formData.explanation, formData.notes, autoResize]);

  const handleSave = async () => {
    if (!word || !hasChanges) return;
    setError('');
    setIsSaving(true);
    try {
      const updateData: WordUpdate = {
        title: formData.title,
        explanation: formData.explanation,
        notes: formData.notes || undefined,
        tags: formData.tagIds,
      };
      await wordsService.update(word.id, updateData);
      const updated = await wordsService.getById(word.id);
      setWord(updated);
      initFormFromWord(updated, tags);
      setSaveSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setError(axiosError.response?.data?.detail || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!word) return;
    setIsSubmitting(true);
    try {
      await wordsService.delete(word.id);
      navigate('/dashboard/words');
    } catch {
      console.error('Failed to delete word');
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
      const updated = await wordsService.getById(word.id);
      setWord(updated);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail: string }>;
      setUploadError(axiosError.response?.data?.detail || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async () => {
    if (!word || !selectedMedia) return;
    setIsSubmitting(true);
    try {
      await wordsService.deleteMedia(word.id, selectedMedia.id);
      setIsDeleteMediaOpen(false);
      setSelectedMedia(null);
      const updated = await wordsService.getById(word.id);
      setWord(updated);
    } catch {
      console.error('Failed to delete media');
    } finally {
      setIsSubmitting(false);
    }
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
    } catch {
      window.open(fullUrl, '_blank');
    }
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) ? prev.tagIds.filter(id => id !== tagId) : [...prev.tagIds, tagId],
    }));
  };

  const getMediaIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) return <Image size={24} />;
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext || '')) return <Film size={24} />;
    return <FileText size={24} />;
  };

  const isImage = (url: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(url.split('.').pop()?.toLowerCase() || '');
  const isVideo = (url: string) => ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(url.split('.').pop()?.toLowerCase() || '');
  const getFullMediaUrl = (url: string) => url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  if (isLoading) return <LoadingSpinner />;
  if (!word) return <div className="text-center py-12"><p className="text-dark-400">Word not found</p></div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/dashboard/words')} className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back to Words
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
      <div className="card space-y-6 mb-8">
        {/* Title */}
        <div>
          <label className="label">Word <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="input text-2xl font-display"
            placeholder="Enter the word"
            required
          />
        </div>

        {/* Explanation */}
        <div>
          <label className="label">Explanation <span className="text-red-400">*</span></label>
          <textarea
            ref={explanationRef}
            value={formData.explanation}
            onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
            className="input min-h-[60px] resize-none text-base leading-relaxed overflow-hidden"
            placeholder="Enter the explanation or definition"
            required
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
            placeholder="Add personal notes, example sentences, etc."
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
            {new Date(word.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Media Files Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-white">Media Files</h2>
          <div>
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="btn-primary">
              {isUploading ? <span className="spinner" /> : <><Upload size={18} /> Upload File</>}
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400 text-sm">File uploaded successfully!</p>
          </div>
        )}
        {uploadError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{uploadError}</p>
          </div>
        )}

        {word.media_files.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-dark-700 rounded-xl">
            <Upload className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <p className="text-dark-400 mb-2">No media files yet</p>
            <p className="text-sm text-dark-500">Upload images, videos, or documents to enhance your vocabulary</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {word.media_files.map((media) => {
              const fullUrl = getFullMediaUrl(media.file_url);
              return (
                <div key={media.id} className="group relative bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-dark-600 transition-colors">
                  {isImage(media.file_url) ? (
                    <img src={fullUrl} alt={media.filename} className="w-full h-40 object-cover cursor-pointer" onClick={() => { setPreviewMedia(media); setIsPreviewOpen(true); }} />
                  ) : isVideo(media.file_url) ? (
                    <video src={fullUrl} className="w-full h-40 object-cover" controls />
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center bg-dark-800 cursor-pointer" onClick={() => { setPreviewMedia(media); setIsPreviewOpen(true); }}>
                      {getMediaIcon(media.file_url)}
                      <span className="text-sm text-dark-400 mt-2 px-2 text-center truncate max-w-full">{media.filename}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-dark-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => { setPreviewMedia(media); setIsPreviewOpen(true); }} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors" title="Preview"><Eye size={18} className="text-white" /></button>
                    <button onClick={() => handleDownload(media)} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors" title="Download"><Download size={18} className="text-white" /></button>
                    <button onClick={() => { setSelectedMedia(media); setIsDeleteMediaOpen(true); }} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors" title="Delete"><X size={18} className="text-red-400" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => { setIsPreviewOpen(false); setPreviewMedia(null); }} title={previewMedia?.filename || 'Preview'} size="4xl">
        {previewMedia && (
          <div className="flex flex-col items-center">
            {isImage(previewMedia.file_url) ? (
              <img src={getFullMediaUrl(previewMedia.file_url)} alt={previewMedia.filename} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            ) : isVideo(previewMedia.file_url) ? (
              <video src={getFullMediaUrl(previewMedia.file_url)} className="max-w-full max-h-[70vh] rounded-lg" controls autoPlay />
            ) : (
              <div className="text-center py-12">
                {getMediaIcon(previewMedia.file_url)}
                <p className="text-dark-300 mt-4 mb-2">{previewMedia.filename}</p>
                <p className="text-sm text-dark-500 mb-6">This file type cannot be previewed directly</p>
                <button onClick={() => handleDownload(previewMedia)} className="btn-primary"><Download size={18} /> Download File</button>
              </div>
            )}
            {(isImage(previewMedia.file_url) || isVideo(previewMedia.file_url)) && (
              <button onClick={() => handleDownload(previewMedia)} className="btn-secondary mt-4"><Download size={18} /> Download</button>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Word */}
      <ConfirmDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Word" message={`Are you sure you want to delete "${word.title}"? This action cannot be undone.`} isLoading={isSubmitting} />

      {/* Delete Media */}
      <ConfirmDialog isOpen={isDeleteMediaOpen} onClose={() => { setIsDeleteMediaOpen(false); setSelectedMedia(null); }} onConfirm={handleDeleteMedia} title="Delete Media" message={`Are you sure you want to delete "${selectedMedia?.filename}"? This action cannot be undone.`} isLoading={isSubmitting} />
    </div>
  );
};

export default WordDetailPage;

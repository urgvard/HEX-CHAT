import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  Plus,
  Paperclip,
  Download,
  Trash2,
  Edit2,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { NoticeItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import {
  subscribeNoticeBoard,
  addNotice,
  updateNotice,
  deleteNotice,
  uploadAttachmentFile
} from '../firebase/service';

export const NoticeBoard: React.FC = () => {
  const { currentUser, isAdmin, db, storage } = useAuth();
  const { t, formatLocalizedDate, language } = usePreferences();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for create / edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | undefined>(undefined);
  const [existingFileName, setExistingFileName] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time subscription to notices
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeNoticeBoard(db, (fetchedNotices) => {
      setNotices(fetchedNotices);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleOpenCreateModal = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setSelectedFile(null);
    setExistingFileUrl(undefined);
    setExistingFileName(undefined);
    setErrorMessage(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (notice: NoticeItem) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setSelectedFile(null);
    setExistingFileUrl(notice.fileUrl);
    setExistingFileName(notice.fileName);
    setErrorMessage(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 10MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(t('fileTooLargeError'));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMessage(t('provideTitleAndContentError'));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let fileUrl = existingFileUrl;
      let fileName = existingFileName;

      // If new file chosen, upload to Storage
      if (selectedFile) {
        const uploadRes = await uploadAttachmentFile(
          storage,
          'notice_attachments',
          editingNotice ? editingNotice.id : 'temp_notice',
          selectedFile,
          (percent) => setUploadProgress(percent)
        );
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
      }

      if (editingNotice) {
        await updateNotice(db, editingNotice.id, {
          title: title.trim(),
          content: content.trim(),
          fileUrl,
          fileName
        });
        setSuccessMessage(t('noticeUpdatedSuccess'));
      } else {
        await addNotice(db, {
          title: title.trim(),
          content: content.trim(),
          fileUrl,
          fileName,
          createdBy: currentUser?.uid || 'admin_primary',
          authorName: currentUser?.displayName || 'Admin'
        });
        setSuccessMessage(t('noticeCreatedSuccess'));
      }

      setTimeout(() => setSuccessMessage(null), 4000);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Notice submission error:', err);
      setErrorMessage(err.message || 'Failed to save notice. Please check Firestore security permissions.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm(t('confirmDeleteNotice'))) {
      return;
    }

    try {
      await deleteNotice(db, id);
      setSuccessMessage(t('noticeDeletedSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete notice.');
    }
  };

  const filteredNotices = notices.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t('noticeBoardTitle')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('noticeBoardSubtitle')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-notices"
              type="text"
              placeholder={t('searchNoticesPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 shadow-xs transition"
            />
          </div>

          {/* Admin post button */}
          {isAdmin && (
            <button
              id="btn-create-notice"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 active:scale-98 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newNoticeBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Notice List Feed */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse space-y-3 shadow-xs">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('noNoticesFound')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('noNoticesFoundDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const formattedDate = formatLocalizedDate(notice.createdAt) || 'Recent';

            return (
              <article
                key={notice.id}
                id={`notice-card-${notice.id}`}
                className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 p-5 sm:p-6 transition-all shadow-xs hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                        <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        {t('adminBadge')}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formattedDate}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h2>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 self-end sm:self-start opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                      <button
                        id={`btn-edit-notice-${notice.id}`}
                        onClick={() => handleOpenEditModal(notice)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition"
                        title={t('editNotice')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-notice-${notice.id}`}
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-800 transition"
                        title={t('deleteNotice')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>

                {/* Attachment preview / download */}
                {notice.fileUrl && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    <a
                      id={`link-notice-attachment-${notice.id}`}
                      href={notice.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition group/att shadow-xs"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="truncate max-w-[220px] sm:max-w-md">
                        <span className="font-medium">{notice.fileName || t('downloadAttachment')}</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover/att:text-blue-600 dark:group-hover/att:text-blue-400 transition ml-1" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal (Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingNotice ? t('editNoticeTitle') : t('createNoticeTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNotice} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('noticeTitleLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-notice-title"
                  type="text"
                  required
                  placeholder={t('noticeTitlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('noticeContentLabel')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="modal-notice-content"
                  required
                  rows={5}
                  placeholder={t('noticeContentPlaceholder')}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition resize-y"
                  maxLength={10000}
                />
              </div>

              {/* File Attachment Upload (10MB rule enforced) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{t('noticeAttachmentLabel')}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Max 10MB</span>
                </label>

                {existingFileUrl && !selectedFile && (
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-2">
                    <div className="flex items-center gap-2 truncate text-xs text-slate-700 dark:text-slate-300">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">{existingFileName || 'Attached File'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExistingFileUrl(undefined);
                        setExistingFileName(undefined);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 shrink-0 font-medium"
                    >
                      {t('removeFileBtn')}
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    id="modal-notice-file-input"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition shadow-xs"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{selectedFile ? t('changeFileBtn') : t('chooseFileBtn')}</span>
                  </button>

                  {selectedFile && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 truncate font-medium">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate max-w-[180px] sm:max-w-xs">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {uploadProgress !== null && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{t('uploadingAttachment')}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  {t('cancelBtn')}
                </button>
                <button
                  id="btn-submit-notice"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 active:scale-98 shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? t('savingNoticeBtn') : editingNotice ? t('saveNoticeBtn') : t('publishNoticeBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


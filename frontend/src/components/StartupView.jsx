import { useRef, useState } from 'react';
import { Image as ImageIcon, ImagePlus, Rocket, Trash2, Video, X } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import PostCard from './PostCard';

export default function StartupView() {
  const { posts, createPost } = useStudy();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [schedule, setSchedule] = useState('');

  const [mediaPromptVisible, setMediaPromptVisible] = useState(true);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaDataUrl, setMediaDataUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fileInputRef = useRef(null);

  const openFilePicker = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = (ev) => setMediaDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaDataUrl(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sharing) return;
    setSharing(true);
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        hashtags: hashtags.trim(),
        visibility,
        scheduled_date: schedule ? new Date(schedule).toISOString() : '',
        media_file: mediaFile || null,
        media_type: mediaType || null,
      });
      setTitle('');
      setContent('');
      setHashtags('');
      setVisibility('public');
      setSchedule('');
      removeMedia();
      setMediaPromptVisible(true);
      setMessage('Idea shared!');
      setMessageError(false);
    } catch (error) {
      setMessage(error.message || 'Failed to share');
      setMessageError(true);
    } finally {
      setSharing(false);
    }
  };

  const handleExtend = (post) => {
    setTitle(`Extended: ${post.title}`);
    setContent(`${post.content}\n\n--- Extended idea ---\n`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="pt-7" aria-labelledby="startup-title">
      <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">Startup wall</p>
      <h1 id="startup-title" className="display-face m-0 mt-2">
        New ideas
      </h1>
      <p className="mt-2 max-w-xl">Share posts, images, or schedule study sessions.</p>

      <section className="surface mt-5 rounded-[26px] p-5 sm:p-6">
        <h2 className="display-face mt-0">Post an idea</h2>

        {mediaPromptVisible && (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-[#c8cdd9] bg-[#f9faff] p-5 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-[#3b52cf]" />
            <p className="mt-2 text-sm font-bold">Attach an image or video to support your idea.</p>
            <div className="mt-3 flex justify-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#eaedfa] px-4 py-2 text-sm font-bold text-[#3b52cf]"
                onClick={() => openFilePicker('image/*')}
              >
                <ImageIcon className="h-4 w-4" /> Image
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#eaedfa] px-4 py-2 text-sm font-bold text-[#3b52cf]"
                onClick={() => openFilePicker('video/*')}
              >
                <Video className="h-4 w-4" /> Video
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#f0f0f4] px-4 py-2 text-sm font-bold text-[#5a6478]"
                onClick={() => setMediaPromptVisible(false)}
              >
                <X className="h-4 w-4" /> Skip
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {mediaDataUrl && (
              <div className="mt-3">
                {mediaType === 'image' ? (
                  <img className="media-preview" src={mediaDataUrl} alt="Preview" />
                ) : (
                  <video className="media-preview" src={mediaDataUrl} controls />
                )}
                <button
                  type="button"
                  className="mt-2 text-sm font-bold text-[#e04980]"
                  onClick={removeMedia}
                >
                  <Trash2 className="inline h-3 w-3" /> Remove
                </button>
              </div>
            )}
          </div>
        )}

        <form className="mt-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="post-title-input">
              Post title
            </label>
            <input
              id="post-title-input"
              className="field"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-bold" htmlFor="idea-content">
              Idea details
            </label>
            <textarea
              id="idea-content"
              className="field min-h-[80px]"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-bold" htmlFor="hashtags-input">
              Hashtags
            </label>
            <input
              id="hashtags-input"
              className="field"
              placeholder="#startup #idea"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-bold" htmlFor="visibility-select">
                Visibility
              </label>
              <select
                id="visibility-select"
                className="field"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold" htmlFor="schedule-input">
                Schedule
              </label>
              <input
                id="schedule-input"
                className="field"
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </div>
          </div>
          <button
            className="mt-5 flex w-full justify-center rounded-xl px-4 py-3 font-bold"
            type="submit"
            disabled={sharing}
          >
            <Rocket className="mr-2 h-4 w-4" />
            {sharing ? 'Sharing…' : 'Share idea'}
          </button>
          {message && (
            <p
              className="mt-3 min-h-[1.25rem] text-sm font-medium"
              style={{ color: messageError ? '#d83d72' : '#5a6478' }}
            >
              {message}
            </p>
          )}
        </form>
      </section>

      <div className="mt-5">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onExtend={handleExtend} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[#c8cdd9] bg-[#f9faff] px-5 py-11 text-center">
          <p className="font-bold">No startup ideas yet</p>
          <p className="text-sm">Share something to get the feed started.</p>
        </div>
      )}
    </section>
  );
}

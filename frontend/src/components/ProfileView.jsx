import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

export default function ProfileView() {
  const { profile, updateProfile } = useStudy();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roll, setRoll] = useState('');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setRoll(profile.roll_number || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roll_number: roll.trim(),
      });
      setMessage('Profile saved!');
      setMessageError(false);
    } catch (error) {
      setMessage(error.message || 'Unable to save profile');
      setMessageError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="pt-7" aria-labelledby="profile-title">
      <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">Profile</p>
      <h1 id="profile-title" className="display-face m-0 mt-2">
        Your account
      </h1>
      <section className="surface mt-5 rounded-[26px] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          <img
            className="h-20 w-20 rounded-full border-4 border-[#e2e5ef] object-cover"
            src="https://api.dicebear.com/6.x/avataaars/svg?seed=Student"
            alt="Profile"
            loading="lazy"
          />
          <div>
            <p className="m-0 text-lg font-bold">{username || 'Student'}</p>
            <p className="m-0 text-sm text-[#5a6478]">{email}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              className="field"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="profile-phone">
              Phone
            </label>
            <input
              id="profile-phone"
              className="field"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold" htmlFor="profile-roll">
              Roll number
            </label>
            <input
              id="profile-roll"
              className="field"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
            />
          </div>
          <button
            className="flex w-full justify-center rounded-xl px-4 py-3 font-bold"
            type="submit"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {message && (
            <p
              className="min-h-[1.25rem] text-sm"
              style={{ color: messageError ? '#d83d72' : '#5a6478' }}
            >
              {message}
            </p>
          )}
        </form>
      </section>
    </section>
  );
}

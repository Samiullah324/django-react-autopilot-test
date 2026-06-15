import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client';
import { isStrongPassword, PASSWORD_HINT } from '../constants/validation';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!isStrongPassword(passwords.new_password)) {
      setPasswordError(PASSWORD_HINT);
      return;
    }
    if (passwords.new_password !== passwords.new_password_confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(passwords);
      setPasswordSuccess('Password changed successfully. Please sign in again.');
      setPasswords({ current_password: '', new_password: '', new_password_confirm: '' });
      navigate('/login');
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Profile</h2>
          <p>Manage your account details and password</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Account information</h3>
        </div>
        <div className="card-body">
          {profileSuccess && <div className="success-banner">{profileSuccess}</div>}
          {profileError && <div className="error-banner">{profileError}</div>}
          <form onSubmit={handleProfileSubmit}>
            <div className="form-row">
              <div className="form-group form-group--spaced">
                <label htmlFor="profile-first-name">First name</label>
                <input
                  id="profile-first-name"
                  value={profile.first_name}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="form-group form-group--spaced">
                <label htmlFor="profile-last-name">Last name</label>
                <input
                  id="profile-last-name"
                  value={profile.last_name}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group form-group--spaced">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-group form-group--spaced">
              <label htmlFor="profile-phone">Phone</label>
              <input
                id="profile-phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input value={user?.username || ''} disabled />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Change password</h3>
        </div>
        <div className="card-body">
          {passwordSuccess && <div className="success-banner">{passwordSuccess}</div>}
          {passwordError && <div className="error-banner">{passwordError}</div>}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group form-group--spaced">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current_password: e.target.value }))
                }
                autoComplete="current-password"
                required
              />
            </div>
            <div className="form-group form-group--spaced">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                autoComplete="new-password"
                required
              />
              <p className="field-hint">{PASSWORD_HINT}</p>
            </div>
            <div className="form-group form-group--spaced">
              <label htmlFor="confirm-new-password">Confirm new password</label>
              <input
                id="confirm-new-password"
                type="password"
                value={passwords.new_password_confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new_password_confirm: e.target.value }))
                }
                autoComplete="new-password"
                required
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Change password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

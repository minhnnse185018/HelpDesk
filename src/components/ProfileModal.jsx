import { useEffect, useMemo, useState } from 'react'
import {
  changePassword,
  getUserProfile,
  updateUserProfile,
} from '../api/auth'

function ProfileModal({ open, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    avatar: '',
    role: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!open) return
    setError('')
    setStatus('')
    setLoading(true)
    getUserProfile()
      .then((res) => {
        const data = res?.data || res || {}
        setProfile({
          email: data.email || '',
          username: data.username || '',
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          avatar: data.avatar || '',
          role:
            (Array.isArray(data.role) && data.role[0] && data.role[0].toUpperCase()) ||
            '',
        })
      })
      .catch((err) => {
        setError(err?.message || 'Cannot load account information')
      })
      .finally(() => setLoading(false))
  }, [open])

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    // Basic validation
    const phoneValid =
      !profile.phoneNumber ||
      /^[0-9()+\-\s]{8,20}$/.test(profile.phoneNumber.trim())
    if (!phoneValid) {
      setError('Invalid phone number')
      return
    }
    if (profile.fullName && profile.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters long')
      return
    }
    if (profile.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth)
      if (Number.isNaN(dob.getTime())) {
        setError('Invalid date of birth format')
        return
      }
      if (dob.getFullYear() > 2007) {
        setError('Date of birth must be before or in 2007 year')
        return
      }
    }
    setSavingProfile(true)
    try {
      await updateUserProfile({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        avatar: profile.avatar,
      })
      setStatus('Profile updated successfully')
      if (typeof onUpdated === 'function') onUpdated()
    } catch (err) {
      setError(err?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    if (!passwordForm.currentPassword.trim()) {
      setError('Please enter current password')
      return
    }
    if (!passwordForm.newPassword.trim()) {
      setError('Please enter new password')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Confirm password does not match')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(passwordForm)
      setStatus('Password changed successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const dateValue = useMemo(() => {
    if (!profile.dateOfBirth) return ''
    const d = new Date(profile.dateOfBirth)
    if (Number.isNaN(d.getTime())) return profile.dateOfBirth
    return d.toISOString().slice(0, 10)
  }, [profile.dateOfBirth])

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflowY: 'auto',
    zIndex: 9999,
    padding: '32px 16px',
  }

  const modalStyle = {
    background: '#fff',
    borderRadius: '12px',
    maxWidth: '1200px',
    width: '100%',
    padding: '20px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
  }

  if (!open) return null

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Account information</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <section className="section">
                <h4>Basic information</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input className="input" value={profile.email} readOnly />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Username</label>
                    <input className="input" value={profile.username} readOnly />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input
                      className="input"
                      name="fullName"
                      value={profile.fullName || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Phone Number (0123456789)</label>
                    <input
                      className="input"
                      name="phoneNumber"
                      value={profile.phoneNumber || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Address</label>
                    <input
                      className="input"
                      name="address"
                      value={profile.address || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Date of Birth</label>
                    <input
                      className="input"
                      type="date"
                      name="dateOfBirth"
                      value={dateValue}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Gender</label>
                    <select
                      className="input"
                      name="gender"
                      value={profile.gender || ''}
                      onChange={handleFieldChange}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Role</label>
                    <input className="input" value={profile.role || ''} readOnly />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </section>

              <section className="section" style={{ marginTop: '16px' }}>
                <h4>Change Password</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Current Password</label>
                    <input
                      className="input"
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">New Password</label>
                    <input
                      className="input"
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Confirm Password</label>
                    <input
                      className="input"
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </section>

              {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
              {status && !error && (
                <div className="form-success" style={{ marginTop: 12 }}>{status}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileModal

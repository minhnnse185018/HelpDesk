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
        setError(err?.message || 'Không tải được thông tin tài khoản')
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
      setError('Số điện thoại không hợp lệ')
      return
    }
    if (profile.fullName && profile.fullName.trim().length < 2) {
      setError('Họ tên cần ít nhất 2 ký tự')
      return
    }
    if (profile.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth)
      if (Number.isNaN(dob.getTime())) {
        setError('Ngày sinh không hợp lệ')
        return
      }
      if (dob.getFullYear() > 2007) {
        setError('Ngày sinh phải trước hoặc trong năm 2007')
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
      setStatus('Cập nhật thông tin thành công')
      if (typeof onUpdated === 'function') onUpdated()
    } catch (err) {
      setError(err?.message || 'Cập nhật thông tin thất bại')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')
    if (!passwordForm.currentPassword.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!passwordForm.newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword(passwordForm)
      setStatus('Đổi mật khẩu thành công')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(err?.message || 'Đổi mật khẩu thất bại')
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
          <h3>Thông tin tài khoản</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <>
              <section className="section">
                <h4>Thông tin cơ bản</h4>
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
                    <label className="form-label">Họ tên</label>
                    <input
                      className="input"
                      name="fullName"
                      value={profile.fullName || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="input"
                      name="phoneNumber"
                      value={profile.phoneNumber || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Địa chỉ</label>
                    <input
                      className="input"
                      name="address"
                      value={profile.address || ''}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Ngày sinh</label>
                    <input
                      className="input"
                      type="date"
                      name="dateOfBirth"
                      value={dateValue}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Giới tính</label>
                    <select
                      className="input"
                      name="gender"
                      value={profile.gender || ''}
                      onChange={handleFieldChange}
                    >
                      <option value="">Chọn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Vai trò</label>
                    <input className="input" value={profile.role || ''} readOnly />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </section>

              <section className="section" style={{ marginTop: '16px' }}>
                <h4>Đổi mật khẩu</h4>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <input
                      className="input"
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Mật khẩu mới</label>
                    <input
                      className="input"
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Xác nhận mật khẩu</label>
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
                  {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
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

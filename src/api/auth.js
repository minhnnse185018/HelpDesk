import { apiClient } from './client'

// Các hàm kiểm tra dữ liệu đầu vào
export const isValidEmail = (value) =>
  typeof value === 'string' &&
  value.trim().length > 3 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const isValidPassword = (value, minLength = 8) =>
  typeof value === 'string' && value.trim().length >= minLength

export const isNonEmpty = (value) =>
  typeof value === 'string' && value.trim().length > 0

export const isValidPhone = (value) =>
  typeof value === 'string' && /^[0-9()+\-\s]{8,20}$/.test(value.trim())

// API
export const login = (payload) => apiClient.post('/api/v1/auth/login', payload)

export const register = (payload) =>
  apiClient.post('/api/v1/auth/register', payload)

export const verifyEmail = (payload) =>
  apiClient.post('/api/v1/auth/verify-email', payload)

export const resendOtp = (payload) =>
  apiClient.post('/api/v1/auth/resend-otp', payload)

export const forgotPassword = (payload) =>
  apiClient.post('/api/v1/auth/forgot-password', payload)

export const resetPassword = (payload) =>
  apiClient.post('/api/v1/auth/reset-password', payload)

export const refreshToken = (payload) =>
  apiClient.post('/api/v1/auth/refresh', payload)

export const logout = (payload) =>
  apiClient.post('/api/v1/auth/logout', payload)

export const getProfile = () => apiClient.get('/api/v1/users/profile')
export const getUserProfile = () => apiClient.get('/api/v1/users/profile')
export const updateUserProfile = (payload) =>
  apiClient.patch('/api/v1/users/profile', payload)
export const changePassword = (payload) =>
  apiClient.patch('/api/v1/users/password', payload)


// ==============================
// VALIDATION — BẢN TIẾNG VIỆT
// ==============================

export const validateLoginPayload = ({ email, password }) => {
  const errors = {}
  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  if (!isValidPassword(password)) errors.password = 'Mật khẩu không hợp lệ'
  return errors
}

export const validateRegisterPayload = ({
  email,
  password,
  username,
  phoneNumber,
  confirmPassword,
}) => {
  const errors = {}

  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  if (!isValidPassword(password))
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
  if (!isNonEmpty(username)) errors.username = 'Họ tên không được bỏ trống'
  if (!isValidPhone(phoneNumber))
    errors.phoneNumber = 'Số điện thoại không hợp lệ'

  if (typeof confirmPassword !== 'undefined' && password !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  }

  return errors
}

export const validateVerifyEmailPayload = ({ email, otp }) => {
  const errors = {}
  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  if (!isNonEmpty(otp)) errors.otp = 'OTP không được bỏ trống'
  return errors
}

export const validateResendOtpPayload = ({ email }) => {
  const errors = {}
  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  return errors
}

export const validateForgotPasswordPayload = ({ email }) => {
  const errors = {}
  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  return errors
}

export const validateResetPasswordPayload = ({
  email,
  otp,
  newPassword,
  confirmPassword,
}) => {
  const errors = {}

  if (!isValidEmail(email)) errors.email = 'Email không hợp lệ'
  if (!isNonEmpty(otp)) errors.otp = 'OTP không được bỏ trống'

  if (!isValidPassword(newPassword))
    errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự'

  if (newPassword !== confirmPassword)
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp'

  return errors
}

export const validateRefreshPayload = ({ refreshToken }) => {
  const errors = {}
  if (!isNonEmpty(refreshToken))
    errors.refreshToken = 'Refresh token không được bỏ trống'
  return errors
}

export const validateLogoutPayload = ({ refreshToken }) => {
  const errors = {}
  if (!isNonEmpty(refreshToken))
    errors.refreshToken = 'Refresh token không được bỏ trống'
  return errors
}

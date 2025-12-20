import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { ActionButton, AlertModal } from '../../components/templates'

function CreateTicket() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState([])
  const [alertModal, setAlertModal] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    categoryIds: [],
  })

  const loadRooms = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/rooms')
      const roomsData = response?.data || {}
      const roomsList = Array.isArray(roomsData)
        ? roomsData
        : Object.values(roomsData).filter(Boolean)
      setRooms(roomsList.filter(room => room.isActive))
    } catch (err) {
      console.error('Failed to load rooms:', err)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/categories')
      const categoriesData = response?.data || {}
      const categoriesList = Array.isArray(categoriesData)
        ? categoriesData
        : Object.values(categoriesData).filter(Boolean)
      setCategories(categoriesList.filter(cat => cat.isActive))
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRooms()
    loadCategories()
  }, [loadRooms, loadCategories])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (e) => {
    const id = e.target.value
    if (id && !formData.categoryIds.includes(id)) {
      setFormData(prev => ({
        ...prev,
        categoryIds: [...prev.categoryIds, id],
      }))
    }
  }

  const removeCategory = (id) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.filter(c => c !== id),
    }))
  }

  const validateFile = (file) => {
    const maxVideo = 50 * 1024 * 1024
    const maxDoc = 10 * 1024 * 1024
    const videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']

    if (videoTypes.includes(file.type)) {
      if (file.size > maxVideo) return 'Video must be less than 50MB'
    } else {
      if (file.size > maxDoc) return 'Images/Documents must be less than 10MB'
    }
    return null
  }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (files.length + selected.length > 10) {
      setError('Maximum 10 files allowed')
      return
    }

    const valid = []
    for (const file of selected) {
      const err = validateFile(file)
      if (err) {
        setError(err)
        return
      }
      valid.push(file)
    }

    setFiles(prev => [...prev, ...valid])
    setError('')
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) return setError('Title is required')
    if (!formData.description.trim()) return setError('Description is required')
    if (!formData.roomId) return setError('Please select a room')
    if (formData.categoryIds.length === 0) return setError('Please select at least one category')

    setSubmitting(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('title', formData.title)
      fd.append('description', formData.description)
      fd.append('roomId', formData.roomId)

      formData.categoryIds.forEach(id => fd.append('categoryIds', id))
      files.forEach(file => fd.append('files', file))

      const response = await apiClient.post('/api/v1/tickets', fd)
      const newTicket = response?.data || response

      // Emit custom event để các component khác có thể listen
      window.dispatchEvent(new CustomEvent('ticket:created', { 
        detail: newTicket 
      }))

      setAlertModal({
        type: 'success',
        title: 'Success',
        message: 'Ticket created successfully!'
      })
      
      setTimeout(() => {
        navigate('/student/my-tickets')
      }, 1500)
    } catch (err) {
      const errorMessage = err?.message || 'Failed to create ticket'
      setError(errorMessage)
      setAlertModal({
        type: 'error',
        title: 'Error',
        message: errorMessage
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryName = (id) => {
    return categories.find(c => c.id === id)?.name || id
  }

  const getFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return null
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.startsWith('video/')) return '🎥'
    if (file.type.includes('pdf')) return '📄'
    return '📎'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Create New Ticket
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Submit a new ticket regarding facility, WiFi, or equipment issues.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                color: '#991b1b',
                fontSize: '0.875rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Form Body */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>

              {/* Title */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Example: TV in room A101 is broken"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Description <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Example: TV won't turn on, no power light"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              {/* Room + Category */}
              <div style={{
                display: 'grid',
                gap: '1.5rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
              }}>

                {/* Room */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Room <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="roomId"
                    value={formData.roomId}
                    onChange={handleInputChange}
                    disabled={submitting || loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select a room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.code} (Floor {r.floor})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Category <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    onChange={handleCategoryChange}
                    value=""
                    disabled={submitting || loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Add category</option>
                    {categories
                      .filter(c => !formData.categoryIds.includes(c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>

                  {/* Selected Categories */}
                  {formData.categoryIds.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {formData.categoryIds.map(id => (
                        <span key={id} style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1e40af',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {getCategoryName(id)}
                          <button
                            type="button"
                            onClick={() => removeCategory(id)}
                            disabled={submitting}
                            style={{
                              border: 'none',
                              background: 'none',
                              cursor: submitting ? 'not-allowed' : 'pointer',
                              color: '#6b7280',
                              fontSize: '1.125rem',
                              lineHeight: '1',
                              padding: '0'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Section - IMPROVED */}
              <div style={{
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem'
                }}>
                  Attachments (Optional)
                </label>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={submitting}
                  style={{ display: 'none' }}
                />

                {/* Upload Area */}
                <label
                  htmlFor="file-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    background: '#fafbfc',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.backgroundColor = '#eff6ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db'
                    e.currentTarget.style.backgroundColor = '#fafbfc'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📎</div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Click to upload or drag and drop
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Max 10 files · Images/Docs ≤ 10MB · Videos ≤ 50MB
                  </div>
                  {files.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#3b82f6'
                    }}>
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </label>

                {/* File Preview Grid */}
                {files.length > 0 && (
                  <div style={{
                    marginTop: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '1rem'
                  }}>
                    {files.map((file, index) => {
                      const preview = getFilePreview(file)
                      const isImage = file.type.startsWith('image/')
                      
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            backgroundColor: '#f9fafb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          {/* Preview/Icon */}
                          {isImage && preview ? (
                            <img
                              src={preview}
                              alt={file.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem'
                            }}>
                              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                {getFileIcon(file)}
                              </div>
                              <div style={{
                                fontSize: '0.625rem',
                                color: '#6b7280',
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                wordBreak: 'break-word'
                              }}>
                                {file.name}
                              </div>
                            </div>
                          )}

                          {/* File Info Overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                            padding: '0.5rem',
                            paddingTop: '1.5rem'
                          }}>
                            <div style={{
                              fontSize: '0.625rem',
                              color: 'white',
                              fontWeight: '600',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {file.name}
                            </div>
                            <div style={{
                              fontSize: '0.625rem',
                              color: 'rgba(255,255,255,0.8)'
                            }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>

                          {/* Remove Button */}
                          <ActionButton
                            type="button"
                            variant="danger"
                            onClick={() => removeFile(index)}
                            disabled={submitting}
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              width: '1.75rem',
                              height: '1.75rem',
                              minWidth: '1.75rem',
                              padding: '0',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              fontWeight: '700',
                              lineHeight: '1',
                            }}
                          >
                            ×
                          </ActionButton>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                💡 Response time will be based on SLA
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/student/dashboard')}
                  disabled={submitting}
                >
                  Cancel
                </ActionButton>

                <ActionButton
                  type="submit"
                  variant="success"
                  disabled={submitting || loading}
                >
                  {submitting ? '⏳ Submitting...' : '✓ Submit Ticket'}
                </ActionButton>
              </div>
            </div>

          </div>
        </form>
      </div>

      {alertModal && (
        <AlertModal
          isOpen={!!alertModal}
          message={alertModal.message}
          title={alertModal.title || 'Notice'}
          type={alertModal.type || 'info'}
          onClose={() => setAlertModal(null)}
        />
      )}
    </div>
  )
}

export default CreateTicket
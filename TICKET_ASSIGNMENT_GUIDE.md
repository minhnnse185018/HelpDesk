# 🎫 Hướng Dẫn Assign Ticket cho Staff

## Tổng quan

Có **2 trường hợp assign ticket** trong hệ thống HelpDesk:

1. **Assign PARENT ticket trực tiếp** (ticket có 1 category duy nhất)
2. **Assign staff khi SPLIT ticket** (ticket có nhiều categories)

---

## 1️⃣ Assign PARENT Ticket (1-1: 1 ticket – 1 category)

### API Endpoint
```
POST /api/v1/tickets/{id}/assign-category
```

### Request Body
```json
{
  "staffId": "uuid-staff",
  "priority": "high",
  "slaPolicyId": "uuid-sla-policy"
}
```

### UI: Tab "Pending Assignment" trong TicketManagement

#### Hiển thị danh sách tickets cần assign

**Endpoint:** `GET /api/v1/tickets/admin/pending-assignment`

**Bảng hiển thị:**
| Column | Field | Description |
|--------|-------|-------------|
| Title | `title` | Tiêu đề ticket |
| Department | `department.name` | Phòng ban |
| Room | `room.name` | Phòng |
| Categories | `ticketCategories.length` | Số lượng categories (badge xanh nếu = 1, vàng nếu > 1) |
| Priority | `priority` | Badge: low/medium/high/critical |
| Status | `status` | Badge: open/assigned/... |
| Created At | `createdAt` | Thời gian tạo |
| Actions | - | Button "Assign to Staff" |

#### Modal: Assign Ticket to Staff

Khi click "Assign to Staff", modal hiển thị:

**Thông tin ticket (read-only):**
- Title
- Room name
- Department name
- Current priority (badge)

**Form inputs:**
- **Staff** (required): Select từ `GET /api/v1/users?role=staff`
- **Priority** (required): Select low/medium/high/critical (default = ticket.priority)
- **SLA Policy** (required): Select từ `GET /api/v1/sla-policies/active`
  - Tự động filter theo priority đã chọn
  - Hiển thị warning nếu không có SLA phù hợp

**Submit:**
- Gọi `POST /api/v1/tickets/{id}/assign-category`
- Success: Đóng modal → Hiển thị "✅ Ticket assigned to staff successfully!"
- Refresh danh sách tickets

---

## 2️⃣ Assign Staff khi SPLIT Ticket (Multi-category)

### API Endpoint
```
POST /api/v1/tickets/{id}/split-categories
```

### Request Body
```json
{
  "groups": [
    {
      "categoryIds": ["uuid-cat1"],
      "staffId": "uuid-staff-A"  // Optional
    },
    {
      "categoryIds": ["uuid-cat2"],
      "staffId": "uuid-staff-B"  // Optional
    }
  ]
}
```

### UI: Tab "Pending Split" trong TicketManagement

#### Hiển thị danh sách tickets cần split

**Endpoint:** `GET /api/v1/tickets/admin/pending-split`

**Bảng hiển thị:**
| Column | Field | Description |
|--------|-------|-------------|
| Title | `title` | Tiêu đề ticket |
| Room | `room.name` | Phòng |
| Categories | `categories[].name` | Danh sách categories (comma-separated) |
| Created At | `createdAt` | Thời gian tạo |
| Actions | - | Button "Split Categories" |

#### Modal: Split Categories & Assign Staff

Khi click "Split Categories", modal hiển thị:

**Thông tin:**
- Ticket title (read-only)
- Mô tả: "This will create a separate sub-ticket for each category"

**For each category:**
```
┌─────────────────────────────────────────┐
│ Sub-ticket 1: [Category Name]          │
│                                         │
│ Assign to Staff (Optional)             │
│ [Dropdown: Select staff or None]       │
└─────────────────────────────────────────┘
```

**Staff dropdown:**
- Load từ `GET /api/v1/users?role=staff`
- Option: "-- No Assignment (Assign Later) --" (value = "")
- Các staff: `{fullName}` hoặc `{username}`

**Submit:**
- Build groups array với `categoryIds` và optional `staffId`
- Gọi `POST /api/v1/tickets/{id}/split-categories`
- Success: Đóng modal → Hiển thị "✅ Ticket split successfully! Sub-tickets have been created."
- Refresh danh sách tickets

---

## Backend Behavior

### Khi assign parent ticket:
```javascript
ticket.assignedTo = staffId
ticket.priority = priority
ticket.slaPolicyId = slaPolicyId
ticket.assignedAt = now()
ticket.status = 'assigned'
```

### Khi split ticket với staff:
```javascript
// Mỗi group tạo 1 sub-ticket
subTicket.assignedTo = group.staffId || null
subTicket.status = group.staffId ? 'assigned' : 'open'
subTicket.parentTicket = ticketId
subTicket.categories = group.categoryIds
```

---

## Business Rules

### Tab "Pending Assignment"
✅ Chỉ hiển thị tickets:
- Có **1 category duy nhất** (`ticketCategories.length === 1`)
- Đã set priority (`priority !== null`)
- Chưa assign staff (`assignedTo === null`)

### Tab "Pending Split"
✅ Chỉ hiển thị tickets:
- Có **nhiều hơn 1 category** (`categories.length > 1`)
- Chưa split (`subTickets.length === 0`)

### SLA Policy Filtering
- Khi chọn priority trong modal assign, chỉ hiển thị SLA policies:
  - Không có `priority` constraint (áp dụng cho tất cả)
  - Hoặc có `priority` trùng với priority đã chọn

---

## Code Structure

### Files Modified
- `src/pages/admin/TicketManagement.jsx`
  - ✅ `PendingAssignmentTab` - List + Modal assign 1-1
  - ✅ `AssignTicketModal` - Form assign với staff, priority, SLA
  - ✅ `PendingSplitTab` - List tickets multi-category
  - ✅ `SplitCategoriesModal` - Form split + optional staff assignment

### API Client Usage
```javascript
// Get pending assignment tickets
await apiClient.get('/api/v1/tickets/admin/pending-assignment')

// Get pending split tickets
await apiClient.get('/api/v1/tickets/admin/pending-split')

// Get staff list
await apiClient.get('/api/v1/users?role=staff')

// Get active SLA policies
await apiClient.get('/api/v1/sla-policies/active')

// Assign parent ticket
await apiClient.post(`/api/v1/tickets/${ticketId}/assign-category`, {
  staffId, priority, slaPolicyId
})

// Split ticket with optional staff
await apiClient.post(`/api/v1/tickets/${ticketId}/split-categories`, {
  groups: [
    { categoryIds: [...], staffId: '...' }
  ]
})
```

---

## Testing Checklist

### ✅ Assign Parent Ticket
- [ ] Tab "Pending Assignment" load đúng danh sách
- [ ] Badge categories hiển thị số lượng (xanh nếu 1, vàng nếu nhiều)
- [ ] Modal mở đúng với thông tin ticket
- [ ] Staff dropdown load danh sách đầy đủ
- [ ] SLA dropdown filter theo priority
- [ ] Submit thành công → refresh list
- [ ] Error handling hiển thị message rõ ràng

### ✅ Split & Assign Sub-tickets
- [ ] Tab "Pending Split" load đúng tickets multi-category
- [ ] Modal hiển thị đủ categories
- [ ] Staff dropdown cho mỗi category load đúng
- [ ] Option "No Assignment" hoạt động
- [ ] Submit với/không có staff đều thành công
- [ ] Success message hiển thị
- [ ] Refresh list sau khi split

---

## UI/UX Enhancements

### Badges
- **Categories Count**: Xanh (1 category), Vàng (nhiều categories)
- **Priority**: Low (xanh), Medium (vàng), High (đỏ), Critical (đỏ đậm)
- **Status**: Open (xanh), Assigned (vàng), In Progress (xanh dương), ...

### Modal Improvements
- Thông tin ticket hiển thị trong box màu xám (#f9fafb)
- SLA filter tự động theo priority
- Warning message khi không có SLA phù hợp
- Disable buttons khi đang submit
- Loading states: "Assigning..." / "Splitting..."

### Success/Error Messages
- ✅ Success: Alert với emoji check
- ❌ Error: Alert với emoji cross + error message chi tiết

---

## Next Steps

1. **Test API endpoints** với Postman/Thunder Client
2. **Verify business logic** ở backend (1-1 vs multi-category)
3. **Test UI flows** trên browser
4. **Add validation** cho edge cases (empty staff list, no SLA, etc.)
5. **Consider toast notifications** thay vì alert() để UX tốt hơn

---

🎉 **Hoàn thành!** Admin đã có đầy đủ công cụ để assign tickets cho staff trong cả 2 trường hợp.

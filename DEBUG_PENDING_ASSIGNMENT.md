# 🔍 Debug: Pending Assignment Tab không hiển thị tickets

## Các bước kiểm tra

### 1. Kiểm tra Console Log
Mở **DevTools (F12)** → tab **Console**, tìm các log:
```
Pending Assignment API Response: {...}
Parsed pending assignment tickets: [...]
```

### 2. Kiểm tra cấu trúc API response

API endpoint: `GET /api/v1/tickets/admin/pending-assignment`

**Các cấu trúc response có thể:**

#### Option A: Array trực tiếp
```json
[
  {
    "id": "uuid",
    "title": "Fix printer",
    "priority": "high",
    "status": "open",
    "ticketCategories": [...]
  }
]
```

#### Option B: Wrapped trong object
```json
{
  "data": [...]
}
```

#### Option C: Object với numeric keys
```json
{
  "0": { ticket },
  "1": { ticket }
}
```

#### Option D: Nested structure
```json
{
  "tickets": [...],
  "total": 5
}
```

### 3. Business Rules cho Pending Assignment

Backend **CHỈ** trả về tickets thỏa mãn:

✅ **Điều kiện bắt buộc:**
- `status = 'open'` (hoặc status khác nhưng chưa assigned)
- `assignedTo = null` hoặc `assignee = null`
- `priority != null` (đã set priority)
- `ticketCategories.length === 1` (chỉ có 1 category)

❌ **Không hiển thị nếu:**
- Ticket đã có assignee
- Ticket chưa set priority
- Ticket có nhiều hơn 1 category (phải split trước)
- Ticket đã split thành sub-tickets

### 4. Kiểm tra Backend Logic

Trong backend NestJS, endpoint này có thể như sau:

```typescript
// tickets.controller.ts
@Get('admin/pending-assignment')
async getPendingAssignment() {
  return this.ticketsService.findAll({
    where: {
      assignedTo: IsNull(),
      priority: Not(IsNull()),
      // Filter by single category
    },
    relations: ['room', 'department', 'ticketCategories', 'ticketCategories.category']
  });
}
```

### 5. Tạo test data

Nếu không có tickets trong tab, hãy tạo ticket mẫu:

**Qua Student UI:**
1. Login as Student
2. Create Ticket với:
   - Title: "Test Pending Assignment"
   - Room: (chọn room bất kỳ)
   - **CHỈ CHỌN 1 CATEGORY** ⚠️
   - Priority: HIGH
3. Submit ticket

**Ticket này PHẢI xuất hiện trong tab "Pending Assignment"**

### 6. Kiểm tra Network tab

**DevTools → Network tab:**
1. Filter: `pending-assignment`
2. Click tab "Pending Assignment"
3. Xem request:
   - Status Code: 200? 404? 500?
   - Response body: Có data không?
   - Headers: Authorization có đúng?

### 7. Common Issues & Solutions

#### Issue 1: API trả về 200 nhưng empty array `[]`
**Nguyên nhân:** Không có tickets thỏa mãn điều kiện
**Giải pháp:** Tạo test ticket như mục 5

#### Issue 2: API trả về 401/403
**Nguyên nhân:** Token hết hạn hoặc không có quyền
**Giải pháp:** 
- Logout → Login lại
- Check role user = ADMIN

#### Issue 3: API trả về 404
**Nguyên nhân:** Endpoint chưa implement
**Giải pháp:** Implement endpoint trong backend:
```typescript
@Get('admin/pending-assignment')
async getPendingAssignment() {
  // ... logic
}
```

#### Issue 4: Console log show data nhưng UI không hiển thị
**Nguyên nhân:** Component render issue hoặc field mapping sai
**Giải pháp:** 
- Check `ticketCategories` có tồn tại không
- Check `ticket.room`, `ticket.department` structure

### 8. Expected Console Output (Success)

```javascript
Pending Assignment API Response: {
  data: {
    data: [
      {
        id: "abc-123",
        title: "Fix printer",
        priority: "high",
        status: "open",
        room: { id: "...", name: "Room 101" },
        department: { id: "...", name: "IT" },
        ticketCategories: [
          { category: { id: "...", name: "Hardware" } }
        ],
        assignedTo: null,
        createdAt: "2025-12-10T10:00:00Z"
      }
    ]
  }
}

Parsed pending assignment tickets: [
  { id: "abc-123", title: "Fix printer", ... }
]
```

### 9. Quick Fix: Fallback to All Tickets

Nếu endpoint `/admin/pending-assignment` chưa có, tạm thời dùng `/tickets` và filter client-side:

```javascript
const response = await apiClient.get('/api/v1/tickets')
let allTickets = // ... parse response
const pendingTickets = allTickets.filter(t => 
  !t.assignedTo && 
  t.priority && 
  t.ticketCategories?.length === 1
)
setTickets(pendingTickets)
```

### 10. Test Checklist

- [ ] DevTools Console không có error
- [ ] API response status = 200
- [ ] Response body có array of tickets
- [ ] Tickets có đầy đủ fields: id, title, room, department, ticketCategories
- [ ] `ticketCategories` là array và length >= 1
- [ ] Table render đúng số dòng = tickets.length
- [ ] Badges hiển thị đúng màu và text

---

## Next Step

Sau khi check console log, paste response vào đây để tôi debug cụ thể hơn! 🔧

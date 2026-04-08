# MÔ TẢ HỆ THỐNG ĐẤU GIÁ - BIDVIBE

---

## I. DÀNH CHO NGƯỜI DÙNG (USER)

### 1. Định danh & Uy tín (Identity & Reputation)

- **Đăng nhập**: Tích hợp Google OAuth 2.0 qua Supabase Authentication.
- **Hồ sơ cá nhân**: Quản lý Nickname, Avatar, Số điện thoại và Địa chỉ giao hàng.
- **Hệ thống uy tín**:
  - Sau mỗi giao dịch hoàn tất (item status chuyển sang `SHIPPED`), cả hai bên (người mua và người bán) được mở khóa form đánh giá.
  - Đánh giá từ 1–5 sao kèm nhận xét văn bản.
  - Mỗi cặp `(from_user_id, auction_id)` chỉ được đánh giá **một lần duy nhất**.
  - `reputation_score` trên bảng `Users` là **trung bình cộng** của tất cả các `stars` đã nhận.
  - Hiển thị điểm uy tín trên trang cá nhân và trong phòng đấu giá.

### 2. Quản lý Tài chính (Virtual Wallet)

- **Nạp tiền**:
  1. User tạo yêu cầu → hệ thống sinh mã nội dung chuyển khoản ngẫu nhiên.
  2. Transaction được tạo với `type = DEPOSIT`, `status = PENDING`.
  3. Admin xác nhận sau khi kiểm tra biến động thật → `status = COMPLETED`, `balance_available` tăng.

- **Rút tiền**:
  1. User gửi yêu cầu kèm STK ngân hàng → Transaction `type = WITHDRAW`, `status = PENDING`.
  2. Hệ thống tức thì trừ `balance_available`, tăng `balance_locked` (để tránh rút trùng).
  3. Admin xử lý chuyển khoản thật → `status = COMPLETED`, `balance_locked` giảm.
  4. Nếu Admin từ chối → `status = CANCELLED`, hoàn lại `balance_available`, giảm `balance_locked`.

- **Số dư hai lớp**:
  - `balance_available`: Tiền có thể dùng để bid hoặc rút.
  - `balance_locked` (Escrow): Tiền đang bị giữ làm cọc cho lệnh bid đang hoạt động, hoặc đang chờ xử lý rút.

- **Phí sàn**: 5% trên giá trị giao dịch thắng thầu, trừ vào ví người thắng khi thanh toán cuối (`FINAL_PAYMENT`). Khoản phí này được ghi thành một Transaction riêng `type = PLATFORM_FEE`.

- **Tra cứu**: Nhật ký giao dịch chi tiết với filter theo loại (Nạp, Rút, Mua, Bán, Phí sàn).

### 3. Watchlist (Theo dõi vật phẩm)

- User nhấn "Tim" trên **trang vật phẩm** (`item_id`), không phải trên phiên đấu giá.
- Khi item được Admin phê duyệt và xếp vào phiên (`status = IN_AUCTION`), hệ thống tự động gửi Notification + Email đến tất cả user trong Watchlist của item đó.
- User có thể xem và quản lý Watchlist của mình. Toggle (nhấn lần nữa để bỏ theo dõi).

### 4. Phòng đấu giá Real-time (Live Auction Room)

- Trả giá trực tiếp (Manual Bid) hoặc cài Proxy Bidding.
- Chat room: Tất cả user đang xem phiên đấu giá có thể nhắn tin vào room (`auction_id`).
- Biểu đồ biến động giá (Price Analytics) dạng line-chart, cập nhật real-time.
- Thông báo Outbid: Push Notification đến người bị vượt giá ngay lập tức.

### 5. Kho đồ & Chợ Đen (Inventory & Secondary Market)

- **Ký gửi**: User gửi form (Ảnh upload lên Supabase Storage, Tên, Mô tả, Tags) → item tạo ra với `status = PENDING`, chờ Admin thẩm định. Khi Admin từ chối → `status = REJECTED`, gửi Notification kèm lý do. User **không thể** tái sử dụng item `REJECTED` — phải tạo mới nếu muốn ký gửi lại.
- **Inventory (Kho đồ)**: Danh sách item người dùng đang sở hữu, `status = IN_INVENTORY`.
- **Niêm yết Chợ Đen**:
  1. User chọn item từ kho và đặt `asking_price` → item tạo ra một `MarketListing` với `status = ACTIVE`.
  2. Điều kiện: item không được trong `cooldown_until`, không đang trong đấu giá (`status` phải là `IN_INVENTORY`).
  3. Bộ lọc Search/Filter theo Tags, giá, `rarity`.
- **Chat P2P**: Người mua nhắn tin với người bán qua `Message` với `receiver_id` đặt và `auction_id = null`.
- **Mua Chợ Đen**:
  1. Người mua xác nhận mua → tiền trừ từ `balance_available` của người mua.
  2. Tiền cộng vào `balance_available` của người bán (trừ phí sàn 5%).
  3. `current_owner_id` chuyển sang người mua, `cooldown_until = now() + 12 giờ`.
  4. `MarketListing` chuyển `status = SOLD`.
- **Xác nhận nhận hàng thật**: User bấm "Đã nhận hàng" → item `status = SHIPPED`, đây là **điểm cuối cùng** của vòng đời item trên sàn. Admin sẽ xử lý gửi hàng vật lý.

---

## II. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)

### 1. Quản lý Thị trường

- **Thẩm định**: Duyệt (`APPROVED`) hoặc Từ chối (`REJECTED`) đồ ký gửi từ người dùng. Khi từ chối cần kèm lý do. Item `REJECTED` là trạng thái **cuối** — Admin không thể duyệt lại item cũ.
- **Phân loại**: Gán `tags` (JSON array), `rarity`, `start_price` trước khi xếp vào phiên.
- **Lên lịch**: Xếp item vào `AuctionSession` theo chu kỳ tuần — Tuần 1: English, Tuần 2: Dutch, Tuần 3: Sealed. Mỗi item được tạo một bản ghi `Auction` với `order_index` tương ứng.

### 2. Điều hành Phiên đấu giá

- **Control Panel** — các hành động trên một `AuctionSession`:
  - `START`: Chuyển session `status = ACTIVE`, kích hoạt auction đầu tiên trong session (`order_index = 0`).
  - `PAUSE`: Tạm dừng session, ghi lại `remaining_seconds` vào DB để resume sau.
  - `RESUME`: Tiếp tục session từ `remaining_seconds` đã lưu.
  - `STOP`: Kết thúc session sớm, các auction chưa chạy chuyển `status = CANCELLED`, hoàn tiền locked.
- **Resume sau sự cố**: Khi server khởi động lại, tự động quét các `AuctionSession` có `status = ACTIVE` và `Auction` có `status = ACTIVE` → restore state từ DB, tính lại `remaining_seconds = end_time - now()`.
- **Reset đồng hồ**: Admin có thể reset `end_time` của một `Auction` cụ thể về `now() + duration_seconds`.
- **Xóa giá thầu**: Admin xóa một `Bid` cụ thể → hệ thống tính lại `current_price` và `winner_id` dựa trên bid cao nhất còn lại, hoàn tiền locked cho user bị xóa bid.

### 3. Moderation (Kiểm duyệt người dùng)

- **Mute**: Set `is_muted = true` trên `Users` → user vẫn xem phiên đấu giá, bid bình thường nhưng **không gửi được chat**.
- **Kick**: Ngắt WebSocket connection của user khỏi phòng đấu giá cụ thể. User vẫn có thể reconnect và tiếp tục bid (chỉ mang tính cảnh cáo tức thời).
- **Ban**: Set `is_banned = true`, `banned_at = now()` → mọi API request của user đều nhận `403 FORBIDDEN`. Không thể đăng nhập, không thể bid, không thể chat.
- **Unban**: Set `is_banned = false`, xóa `banned_at`.

### 4. Quản lý Người dùng

- **Danh sách user**: Xem toàn bộ danh sách user, filter theo `role` (USER / ADMIN), `is_banned`, `is_muted`, tìm kiếm theo email hoặc nickname.
- **Chi tiết user**: Xem profile, `reputation_score`, lịch sử giao dịch, lịch sử bid, danh sách item đang sở hữu.
- **Cấp / Thu hồi quyền Admin**: Thay đổi `role` của user giữa `USER` và `ADMIN`.
- Mute / Kick / Ban / Unban đã mô tả ở mục Moderation (II.3).

### 5. Quản lý Vật phẩm

- **Danh sách item toàn sàn**: Xem tất cả item, filter theo `status` (PENDING / APPROVED / IN_AUCTION / IN_INVENTORY / SHIPPED / REJECTED), `rarity`, tags, tên người bán.
- **Chi tiết item**: Xem đầy đủ thông tin, ảnh, lịch sử qua tay (ai từng sở hữu), lịch sử đấu giá liên quan.
- Duyệt / Từ chối / Phân loại / Lên lịch đã mô tả ở mục Quản lý Thị trường (II.1).

### 6. Thống kê & Báo cáo (Analytics)

- **Dashboard tổng quan** (real-time):
  - Tổng số user đã đăng ký, số user hoạt động trong 7 ngày qua.
  - Tổng số phiên đấu giá đã hoàn thành / đang diễn ra.
  - Tổng doanh thu phí sàn (tổng các Transaction `type = PLATFORM_FEE`, `status = COMPLETED`).
  - Số lượng item đang chờ duyệt (`status = PENDING`).
- **Biểu đồ doanh thu**: Doanh thu phí sàn theo ngày / tuần / tháng.
- **Thống kê đấu giá**: Số lượng bid theo từng phiên, giá trị trung bình thắng thầu, tỷ lệ phiên có người thắng vs. không ai bid.
- **Thống kê Chợ Đen**: Số lượng giao dịch P2P hoàn thành theo thời gian, giá trị giao dịch trung bình.

### 7. Tài chính & Tranh chấp

- **Duyệt Nạp/Rút**: Admin xem danh sách Transaction `status = PENDING`, xác nhận hoặc từ chối.
- **Trọng tài Chợ Đen**: Admin xem toàn bộ lịch sử chat P2P giữa hai user trong một giao dịch để giải quyết tranh chấp.

---

## III. CÁC HÌNH THỨC ĐẤU GIÁ (AUCTION TYPES)

### 1. Đấu giá tăng dần (English Auction) — Triển khai trước

**Luồng chính:**
1. Auction được kích hoạt (`status = ACTIVE`), `end_time = now() + 120s`.
2. User trả giá: `amount` phải ≥ `current_price + step_price`.
3. Hệ thống lock tiền: trừ `balance_available`, tăng `balance_locked` của người bid mới. Đồng thời hoàn unlock tiền của người bid cũ (nếu có).
4. Cập nhật `current_price`, `winner_id`.
5. **Popcorn Bidding**: Nếu thời điểm bid mà `end_time - now() < extend_seconds (mặc định 30s)` → set lại `end_time = now() + extend_seconds`.
6. Khi `end_time` đến: auction kết thúc, xử lý thanh toán cuối (xem Business Rules).
7. Sau mỗi auction kết thúc: nghỉ 15 giây, rồi kích hoạt auction tiếp theo (`order_index + 1`) trong session.

**Proxy Bidding:**
- User cài `ProxyBid` với `max_amount` = mức trần tối đa họ chấp nhận.
- Mỗi khi có người bid thủ công, hệ thống kiểm tra tất cả `ProxyBid` còn `is_active = true` của auction đó.
- Nếu `proxy.max_amount > new_bid_amount`: hệ thống tự động tạo một `Bid` mới với `is_proxy = true`, amount = `new_bid_amount + step_price`, cho đến khi đạt `max_amount`.
- Nếu hai proxy cùng kích hoạt: proxy có `max_amount` cao hơn thắng, giá dừng ở `min(max_amount_loser + step_price, max_amount_winner)`.

### 2. Đấu giá giảm dần (Dutch Auction) — Giai đoạn 2

**Luồng chính:**
1. Auction được kích hoạt, `current_price = start_price`.
2. **Trigger giảm giá**: Spring `@Scheduled` job chạy mỗi giây, kiểm tra auction có `status = ACTIVE` và `type = DUTCH`. Nếu đã qua `interval_seconds` kể từ lần giảm trước → giảm `current_price -= decrease_amount`, broadcast `dutch_price_drop` event qua WebSocket.
3. Nếu `current_price <= min_price`: auction kết thúc mà không có người thắng (`status = ENDED`, `winner_id = null`). Item trả về `APPROVED` để Admin xếp lại phiên sau.
4. Người đầu tiên nhấn "MUA" khi `current_price` đang hiển thị → thắng ngay lập tức với giá đó. `end_time` không được dùng để kết thúc — Dutch kết thúc chỉ khi có người mua hoặc giá chạm sàn.
5. **Race condition Dutch**: Nếu hai user nhấn "MUA" đồng thời → dùng `Optimistic Locking` trên `Auction.version`. Người commit DB trước thắng, người sau nhận `409 CONFLICT` và được thông báo "Đã có người mua trước bạn".

### 3. Đấu giá kín (Sealed-bid Auction) — Giai đoạn 3

**Luồng chính:**
1. Auction được kích hoạt, `end_time = now() + 24 giờ`.
2. User gửi giá kín → **Lock tiền ngay lập tức** (`amount` từ `balance_available` sang `balance_locked`). `Bid` được tạo với `is_proxy = false`. **Không** broadcast giá bid cho bất kỳ ai (kể cả Admin).
3. Nếu `balance_available < amount` tại thời điểm submit → từ chối bid, trả `400 BAD REQUEST`.
4. Mỗi user chỉ được đặt **một lần** (kiểm tra unique `auction_id + user_id` trong `Bids`) → trả `409 CONFLICT` nếu đã có.
5. Khi `end_time` đến: Spring `@Scheduled` job tổng hợp tất cả bid, tìm `max(amount)`, set `winner_id`.
6. **Tie-break đồng giá**: Nếu hai user có cùng `amount` cao nhất → chọn bid có `bid_time` **sớm hơn** làm người thắng.
7. Broadcast `sealed_reveal` event qua WebSocket với danh sách tất cả giá thầu, hiển thị công khai nickname và số tiền sau khi mở thầu.
8. Xử lý thanh toán cuối theo Business Rules: người thắng trừ `balance_locked`, trừ phí 5%; người thua unlock `balance_locked` hoàn về `balance_available`.

---

## IV. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

### 1. Luồng Escrow (Lock / Unlock / Charge)

| Sự kiện | Hành động tài chính |
|---|---|
| User đặt bid English thành công | Lock `amount` từ `balance_available` sang `balance_locked` |
| User bị vượt giá (Outbid) | Unlock `amount` cũ, hoàn về `balance_available` |
| Proxy bid tự động (English) | Lock delta tăng thêm, unlock phần cũ |
| Dutch — người thắng nhấn MUA | Lock `current_price` tại thời điểm đó, trừ phí 5% |
| Sealed — user submit bid | Lock `amount` ngay lập tức khi submit |
| Sealed — auction kết thúc, người thua | Unlock `balance_locked`, hoàn về `balance_available` |
| Auction kết thúc — người thắng (English/Sealed) | Trừ `balance_locked` (đã lock), trừ phí sàn 5% từ `balance_available` |
| Auction kết thúc — người thua (English) | Unlock toàn bộ `balance_locked` liên quan |
| Auction bị CANCELLED | Unlock toàn bộ `balance_locked` của tất cả bidder trong auction đó |

### 2. Vòng đời Proxy Bid (`ProxyBid.is_active`)

- `is_active = true`: Khi user mới tạo.
- `is_active = false` khi một trong các điều kiện sau xảy ra:
  - Proxy đã đạt `max_amount` và bị một bid thủ công vượt qua.
  - User thắng auction (không cần proxy nữa).
  - Auction kết thúc (`status = ENDED / CANCELLED`) — batch job xử lý.
  - User tự hủy proxy qua API.

### 3. Vòng đời `cooldown_until` trên Item

- `cooldown_until = now() + 12 giờ` được set vào **đúng hai thời điểm**:
  1. Khi giao dịch Chợ Đen hoàn tất (người mua confirm mua thành công).
  2. Khi người thắng đấu giá được xác nhận (`winner_id` được set, auction `status = ENDED`).
- Trong thời gian cooldown: item **không thể niêm yết** lên Chợ Đen và **không thể ký gửi** lại.

### 4. Quy tắc tính điểm uy tín

- `reputation_score = trung bình(stars)` của tất cả Rating nhận được.
- Chỉ đánh giá khi giao dịch **thật sự hoàn tất** (item `status = SHIPPED`).
- Điểm mặc định cho tài khoản mới: `5.0`.

### 5. Giới hạn và kiểm tra trước khi bid

- `balance_available` phải ≥ `bid_amount` trước khi chấp nhận bid.
- User có `is_banned = true`: từ chối mọi bid với `403 FORBIDDEN`.
- Người bán của item (`seller_id`) **không được** bid vào chính auction của item đó → `403 FORBIDDEN`.
- Sealed-bid: mỗi user chỉ được 1 bid — API trả `409 CONFLICT` nếu đã có bid.
- **Race condition English bid**: Dùng `Optimistic Locking` trên `Auction.version`. Nếu hai bid đến đồng thời, người commit sau nhận `409 CONFLICT` và được thông báo thử lại.
- `ProxyBid` là unique theo `(auction_id, user_id)` — user chỉ có một proxy mỗi auction. Nếu đã tồn tại, gọi API lần nữa sẽ **update** `max_amount` (chỉ cho phép tăng, không cho phép giảm xuống dưới giá bid hiện tại).

### 6. Vòng đời Item (Item Status Flow)

```
PENDING
  ├─[Admin duyệt]──→ APPROVED
  │                     └─[Admin xếp vào phiên]──→ IN_AUCTION
  │                                                   ├─[Có người thắng]──→ IN_INVENTORY
  │                                                   │                       └─[User xác nhận nhận hàng]──→ SHIPPED
  │                                                   └─[Không ai bid]──→ APPROVED (Admin tự xếp lại)
  └─[Admin từ chối]─→ REJECTED (trạng thái cuối, không thể phục hồi)
```

- Item `IN_INVENTORY` **vẫn ở trạng thái `IN_INVENTORY`** khi được niêm yết Chợ Đen — `MarketListing` là bảng riêng theo dõi listing state.
- Sau khi bán Chợ Đen thành công: `current_owner_id` thay đổi, item vẫn `IN_INVENTORY` (với chủ mới), `cooldown_until` được set.
- Item chỉ chuyển sang `SHIPPED` một lần duy nhất khi người dùng xác nhận nhận hàng vật lý từ Admin.

### 7. Vòng đời AuctionSession

- `SCHEDULED` → `ACTIVE` khi Admin bấm START.
- `ACTIVE` → `COMPLETED` tự động khi auction có `order_index` **lớn nhất** trong session kết thúc (Spring job xử lý sau 15 giây break cuối cùng).
- `ACTIVE` → `PAUSED` khi Admin bấm PAUSE (lưu `remaining_seconds` vào DB).
- `PAUSED` → `ACTIVE` khi Admin bấm RESUME.
- Bất kỳ trạng thái nào → `CANCELLED` khi Admin bấm STOP.
- **Không có auction nào trong session**: Admin không thể START session rỗng → trả `400 BAD REQUEST`.

### 8. Hủy niêm yết Chợ Đen (Cancel Market Listing)

- Người bán có thể hủy `MarketListing` bất kỳ lúc nào khi `status = ACTIVE` và **chưa có ai xác nhận mua**.
- Sau khi hủy: `MarketListing.status = CANCELLED`, item vẫn ở `IN_INVENTORY`, `asking_price` trên item được set về `null`.
- Không thể hủy nếu đang trong quá trình thanh toán (trạng thái trung gian chờ xử lý).

---

## V. TÍNH NĂNG BỔ SUNG

### 1. Thông báo đa kênh

| Sự kiện | Kênh |
|---|---|
| Bị vượt giá (Outbid) | WebSocket Push + In-app Notification |
| Thắng đấu giá | In-app Notification + Email |
| Item trong Watchlist vào phiên | In-app Notification + Email |
| Yêu cầu Nạp/Rút được duyệt | In-app Notification + Email |
| Bị Mute / Ban | In-app Notification |

### 2. Hóa đơn PDF (Giai đoạn sau)

- Tự động generate sau khi auction kết thúc và `FINAL_PAYMENT` thành công.
- Nội dung: tên item, ảnh, giá thắng, phí sàn, tổng tiền, timestamp.
- Gửi qua Email và lưu link trên trang lịch sử giao dịch.

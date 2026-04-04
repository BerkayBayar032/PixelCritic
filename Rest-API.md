# Mehmet Berkay Bayar'ın REST API Metotları

**API Test Videosu:** [Video](https://youtu.be/BVj2BnfmckA)



---

## 1. Üye Olma (Register)

- **Endpoint:** `POST /auth/register`
- **Request Body:**

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "test123456"
}
```

- **Authentication:** Gerekli değil
- **Response:** `201 Created` - Kullanıcı başarıyla oluşturuldu

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "testuser@example.com",
    "avatar": null,
    "bio": ""
  }
}
```

---

## 2. Giriş Yapma (Login)

- **Endpoint:** `POST /auth/login`
- **Request Body:**

```json
{
  "identifier": "testuser",
  "password": "test123456"
}
```

- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Giriş başarılı, JWT token döner

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "testuser@example.com",
    "avatar": null,
    "bio": ""
  }
}
```

> **Not:** Dönen `token` değerini saklayın. Korumalı tüm endpointlerde Bearer Token olarak kullanılacaktır.

---

## 3. Mevcut Kullanıcı Bilgilerini Görüntüleme (Get Current User)

- **Endpoint:** `GET /auth/me`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Oturum açmış kullanıcının bilgileri

```json
{
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "testuser@example.com",
    "avatar": null,
    "bio": ""
  }
}
```

---

## 4. Tüm Oyunları Listeleme (Get All Games)

- **Endpoint:** `GET /games`
- **Query Parameters:**
  - `page` (number, opsiyonel) - Sayfa numarası, örn: `1`
  - `limit` (number, opsiyonel) - Sayfa başına oyun sayısı, örn: `10`
  - `genre` (string, opsiyonel) - Tür filtresi, örn: `Shooter`
  - `platform` (string, opsiyonel) - Platform filtresi, örn: `PC (Microsoft Windows)`
  - `theme` (string, opsiyonel) - Tema filtresi, örn: `Science fiction`
  - `developer` (string, opsiyonel) - Geliştirici filtresi, örn: `CD Projekt Red`
  - `publisher` (string, opsiyonel) - Yayıncı filtresi, örn: `Electronic Arts`
  - `minScore` / `maxScore` (number, opsiyonel) - Puan aralığı filtresi
  - `sort` (string, opsiyonel) - Sıralama: `score_desc`, `score_asc`, `release_desc`, `release_asc`, `title_asc`, `title_desc`
  - `search` (string, opsiyonel) - Arama metni, örn: `witcher`
  - `collection` (string, opsiyonel) - Koleksiyon: `Newly Released` veya `Trending Games`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Sayfalanmış oyun listesi

```json
{
  "data": [{ "_id": "...", "title": "...", "coverImage": "...", "averageScore": 8.5 }],
  "page": 1,
  "totalPages": 100,
  "total": 1000
}
```

---

## 5. Trend Oyunları Listeleme (Get Trending Games)

- **Endpoint:** `GET /games/trending`
- **Query Parameters:**
  - `limit` (number, opsiyonel) - Döndürülecek oyun sayısı, örn: `6`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Son 7 gündeki kullanıcı aktivitesine göre sıralanmış oyun dizisi

```json
[
  { "_id": "...", "title": "...", "coverImage": "...", "averageScore": 8.5 }
]
```

---

## 6. Yeni Çıkan Oyunları Listeleme (Get New Releases)

- **Endpoint:** `GET /games/new-releases`
- **Query Parameters:**
  - `limit` (number, opsiyonel) - Döndürülecek oyun sayısı, örn: `6`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Çıkış tarihine göre azalan sırada oyun dizisi

```json
[
  { "_id": "...", "title": "...", "coverImage": "...", "releaseYear": 2026 }
]
```

---

## 7. Oyun Arama (Search Games)

- **Endpoint:** `GET /games/search`
- **Query Parameters:**
  - `q` (string, zorunlu) - Arama terimi, örn: `zelda`
  - `limit` (number, opsiyonel) - Sonuç limiti, örn: `10`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Eşleşen oyunların dizisi

```json
[
  { "_id": "...", "title": "...", "coverImage": "...", "averageScore": 9.2 }
]
```

---

## 8. Türe Göre Oyunları Listeleme (Get Games by Genre)

- **Endpoint:** `GET /games/genre/{genre}`
- **Path Parameters:**
  - `genre` (string, zorunlu) - Oyun türü, örn: `Shooter`
- **Query Parameters:**
  - `limit` (number, opsiyonel) - Sonuç limiti, örn: `10`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Belirtilen türdeki oyunların dizisi

---

## 9. Oyun Detayı Görüntüleme (Get Game by ID)

- **Endpoint:** `GET /games/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si, örn: `69cfdbc6c9eaf3e221ba1213`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Tek bir oyunun tüm detayları

---

## 10. Kütüphaneye Oyun Ekleme (Add Game to Library)

- **Endpoint:** `POST /library`
- **Request Body:**

```json
{
  "gameId": "69cfdbc6c9eaf3e221ba1213",
  "status": "Playing"
}
```

- **Geçerli Durumlar:** `Played`, `Playing`, `Plan to Play`, `Dropped`
- **Authentication:** Bearer Token gerekli
- **Response:** `201 Created` - Oyun kütüphaneye eklendi

```json
{
  "_id": "...",
  "user": "...",
  "game": { "_id": "...", "title": "...", "coverImage": "...", "averageScore": 8.5 },
  "status": "Playing"
}
```

---

## 11. Kullanıcının Kütüphanesini Görüntüleme (Get User's Library)

- **Endpoint:** `GET /library/{userId}`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kullanıcı ID'si, örn: `69d0db08ad7345e0564db257`
- **Query Parameters:**
  - `status` (string, opsiyonel) - Durum filtresi, örn: `Playing`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Oyun verileriyle birlikte kütüphane girişleri dizisi

---

## 12. Bir Oyun İçin Kütüphane Girişi Görüntüleme (Get Library Entry for a Game)

- **Endpoint:** `GET /library/game/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si, örn: `69cfdbc6c9eaf3e221ba1213`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Kütüphane giriş nesnesi veya `null`

---

## 13. Kütüphane Girişini Güncelleme (Update Library Entry)

- **Endpoint:** `PUT /library/{entryId}`
- **Path Parameters:**
  - `entryId` (string, zorunlu) - Kütüphane giriş ID'si, örn: `69d0e7cfc9eaf3e221baab19`
- **Request Body:**

```json
{
  "status": "Played"
}
```

- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Güncellenmiş kütüphane girişi

---

## 14. Kütüphaneden Giriş ID'si ile Kaldırma (Remove from Library by Entry ID)

- **Endpoint:** `DELETE /library/{entryId}`
- **Path Parameters:**
  - `entryId` (string, zorunlu) - Kütüphane giriş ID'si, örn: `69d0e7cfc9eaf3e221baab19`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Kütüphaneden kaldırıldı

```json
{ "message": "Removed from library" }
```

---

## 15. Kütüphaneden Oyun ID'si ile Kaldırma (Remove from Library by Game ID)

- **Endpoint:** `DELETE /library/game/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si, örn: `69cfdbc6c9eaf3e221ba1213`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Kütüphaneden kaldırıldı

```json
{ "message": "Removed from library" }
```

---

## 16. Oyun Puanlama (Rate a Game)

- **Endpoint:** `POST /ratings`
- **Request Body:**

```json
{
  "gameId": "69cfdbc6c9eaf3e221ba121e",
  "score": 8.5,
  "platform": "PlayStation 5"
}
```

- **Authentication:** Bearer Token gerekli
- **Response:** `201 Created` - Puanlama nesnesi döner

---

## 17. Bir Oyun İçin Kendi Puanımı Görüntüleme (Get My Rating for a Game)

- **Endpoint:** `GET /ratings/game/{gameId}/me`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si, örn: `69cfdbc6c9eaf3e221ba1213`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Puanlama nesnesi veya `null`

---

## 18. Bir Oyunun Tüm Puanlarını Listeleme (Get All Ratings for a Game)

- **Endpoint:** `GET /ratings/game/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Puanlama nesneleri dizisi

---

## 19. Kullanıcıya Göre Puanları Listeleme (Get Ratings by User)

- **Endpoint:** `GET /ratings/user/{userId}`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kullanıcı ID'si
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Oyun verileriyle birlikte puanlama nesneleri dizisi

---

## 20. Puanlamayı Silme (Delete My Rating)

- **Endpoint:** `DELETE /ratings/game/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Puanlama silindi

```json
{ "message": "Rating deleted" }
```

---

## 21. İnceleme Yazma (Create Review)

- **Endpoint:** `POST /reviews`
- **Request Body:**

```json
{
  "gameId": "69cfdbc6c9eaf3e221ba1213",
  "content": "Amazing game with great storyline and gameplay mechanics!",
  "rating": 9,
  "platform": "PC (Microsoft Windows)"
}
```

- **Not:** `rating` alanı opsiyoneldir, puan vermeden de inceleme yazılabilir.
- **Authentication:** Bearer Token gerekli
- **Response:** `201 Created` - İnceleme nesnesi döner

---

## 22. Bir Oyunun İncelemelerini Listeleme (Get Reviews for a Game)

- **Endpoint:** `GET /reviews/game/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si
- **Query Parameters:**
  - `platform` (string, opsiyonel) - Platform filtresi, örn: `PC (Microsoft Windows)`
  - `sort` (string, opsiyonel) - Sıralama, örn: `newest`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Yazar bilgileriyle birlikte inceleme nesneleri dizisi

---

## 23. Kullanıcıya Göre İncelemeleri Listeleme (Get Reviews by User)

- **Endpoint:** `GET /reviews/user/{userId}`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kullanıcı ID'si
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Oyun verileriyle birlikte inceleme dizisi

---

## 24. İncelemeye Oy Verme (Vote on Review)

- **Endpoint:** `POST /reviews/{reviewId}/vote`
- **Path Parameters:**
  - `reviewId` (string, zorunlu) - İnceleme ID'si, örn: `69d0f929ad7345e0564db32d`
- **Request Body:**

```json
{
  "type": "upvote"
}
```

- **Geçerli Türler:** `up`, `down`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Oy sayıları güncellenmiş inceleme nesnesi

---

## 25. Bir Oyunun İncelemelerine Verdiğim Oyları Görüntüleme (Get My Votes)

- **Endpoint:** `GET /reviews/game/{gameId}/my-votes`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Oy nesneleri dizisi

---

## 26. İnceleme Silme (Delete Review)

- **Endpoint:** `DELETE /reviews/{reviewId}`
- **Path Parameters:**
  - `reviewId` (string, zorunlu) - İnceleme ID'si, örn: `69d0f929ad7345e0564db32d`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - İnceleme silindi

```json
{ "message": "Review deleted" }
```

---

## 27. Kullanıcı Arama (Search Users)

- **Endpoint:** `GET /users/search`
- **Query Parameters:**
  - `q` (string, zorunlu) - Arama terimi, örn: `test`
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Eşleşen kullanıcıların dizisi

```json
[
  { "_id": "...", "username": "testuser", "avatar": null }
]
```

---

## 28. Kullanıcı Profili Görüntüleme (Get User Profile)

- **Endpoint:** `GET /users/{username}`
- **Path Parameters:**
  - `username` (string, zorunlu) - Kullanıcı adı, örn: `testuser`
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Kullanıcı profil bilgileri

```json
{
  "_id": "...",
  "username": "testuser",
  "avatar": null,
  "bio": "",
  "createdAt": "...",
  "stats": { "totalGames": 5, "totalReviews": 2, "totalRatings": 3 },
  "followers": 0,
  "following": 0
}
```

---

## 29. Profil Güncelleme (Update Profile)

- **Endpoint:** `PUT /users/me`
- **Request Body:**

```json
{
  "bio": "Hardcore gamer and RPG enthusiast!",
  "avatar": "https://example.com/my-avatar.png"
}
```

- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Güncellenmiş kullanıcı nesnesi

---

## 30. Kullanıcı Takip Etme (Follow User)

- **Endpoint:** `POST /follows/{userId}`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Takip edilecek kullanıcının ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Not:** Farklı bir kullanıcı olarak giriş yapılmış olmalıdır.
- **Authentication:** Bearer Token gerekli
- **Response:** `201 Created` - Takip başarılı

```json
{ "message": "Followed successfully" }
```

---

## 31. Takip Durumunu Kontrol Etme (Check Follow Status)

- **Endpoint:** `GET /follows/{userId}/check`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kontrol edilecek kullanıcının ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Takip durumu

```json
{ "isFollowing": true }
```

---

## 32. Takipçileri Listeleme (Get Followers)

- **Endpoint:** `GET /follows/{userId}/followers`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kullanıcı ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Takipçi kullanıcı nesneleri dizisi

---

## 33. Takip Edilenleri Listeleme (Get Following)

- **Endpoint:** `GET /follows/{userId}/following`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kullanıcı ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Takip edilen kullanıcı nesneleri dizisi

---

## 34. Takipçi Kaldırma (Remove Follower)

- **Endpoint:** `DELETE /follows/{userId}/remove-follower`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Kaldırılacak takipçinin ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Takipçi kaldırıldı

```json
{ "message": "Follower removed" }
```

---

## 35. Takibi Bırakma (Unfollow User)

- **Endpoint:** `DELETE /follows/{userId}`
- **Path Parameters:**
  - `userId` (string, zorunlu) - Takibi bırakılacak kullanıcının ID'si, örn: `69d02bc83496d5bf0b1c157a`
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Takip bırakıldı

```json
{ "message": "Unfollowed successfully" }
```

---

## 36. Yapay Zeka Oyun Önerileri Alma (Get AI Recommendations)

- **Endpoint:** `GET /ai/recommendations`
- **Not:** Kişiselleştirilmiş sonuçlar için kullanıcının kütüphanesinde oyun veya yazılmış incelemesi olmalıdır.
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Öneri listesi

```json
{
  "recommendations": [
    {
      "title": "Elden Ring",
      "reason": "Based on your love for RPGs...",
      "matchScore": 95,
      "game": { "_id": "...", "title": "...", "coverImage": "..." }
    }
  ]
}
```

- **Kütüphane/inceleme yoksa:**

```json
{
  "recommendations": [],
  "message": "Add games to your library or write reviews to get personalized recommendations!"
}
```

---

## 37. Yapay Zeka Oyun Analizi Alma (Get AI Game Analysis)

- **Endpoint:** `GET /ai/game-analysis/{gameId}`
- **Path Parameters:**
  - `gameId` (string, zorunlu) - Oyun ID'si
- **Not:** Analizin çalışabilmesi için oyunun incelemelerinin olması gerekir.
- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Yapay zeka analiz sonucu

```json
{
  "analysis": {
    "summary": "Community reception is overwhelmingly positive...",
    "pros": ["Incredible open world", "Deep combat system"],
    "cons": ["Performance issues at launch"],
    "sentiment": "positive"
  }
}
```

---

## 38. Yapay Zeka Avatar Oluşturma (Generate AI Avatars)

- **Endpoint:** `POST /ai/generate-avatars`
- **Request Body:**

```json
{
  "prompt": "cyberpunk ninja with purple neon"
}
```

- **Authentication:** Bearer Token gerekli
- **Response:** `200 OK` - Oluşturulan avatar dizisi

```json
{
  "avatars": [
    { "id": "gen1", "url": "/uploads/avatars/avatar_123_0.png", "label": "Pixel Art" },
    { "id": "gen2", "url": "/uploads/avatars/avatar_123_1.png", "label": "Cyberpunk" },
    { "id": "gen3", "url": "/uploads/avatars/avatar_123_2.png", "label": "Anime Style" },
    { "id": "gen4", "url": "/uploads/avatars/avatar_123_3.png", "label": "3D Render" }
  ]
}
```

---

## 39. Sunucu Sağlık Kontrolü (Health Check)

- **Endpoint:** `GET /health`
- **Authentication:** Gerekli değil
- **Response:** `200 OK` - Sunucu durumu

```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2026-04-04T..."
}
```

---

## Hata Yanıt Formatı

Tüm hata yanıtları aşağıdaki yapıyı takip eder:

```json
{
  "message": "Hata açıklaması burada"
}
```

| HTTP Durum Kodu | Açıklama |
|---|---|
| `400` | Geçersiz istek (eksik/hatalı alanlar) |
| `401` | Yetkisiz (eksik/geçersiz token) |
| `403` | Yasaklı (kaynak sahibi değil) |
| `404` | Kaynak bulunamadı |
| `409` | Çakışma (tekrarlayan kullanıcı adı/e-posta) |
| `429` | İstek limiti aşıldı |

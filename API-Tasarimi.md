# PixelCritic API Tasarımı - OpenAPI Specification

**OpenAPI Spesifikasyon Dosyası:** [pixelcritic.yaml](pixelcritic.yaml)

Bu doküman, PixelCritic oyun kütüphanesi ve inceleme platformu için OpenAPI Specification (OAS) 3.0 standardına göre hazırlanmış RESTful API mimarisini içermektedir.

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: PixelCritic API
  description: |
    Oyuncular için yeni nesil oyun kütüphanesi, inceleme ve AI destekli keşif platformu.
    
    ## Özellikler
    - Kullanıcı Kaydı, Giriş, Çıkış ve Şifre İşlemleri
    - Gelişmiş Kullanıcı Profili ve İstatistikleri
    - Oyun Kataloğu, Arama ve Filtreleme
    - Kişisel Kütüphane Yönetimi (Durum Güncellemeleri)
    - Puanlama (1-10) ve Detaylı İnceleme (Review) Sistemi
    - Topluluk Etkileşimi (İnceleme Oylama, Profil Görüntüleme)
    - Makine Öğrenmesi ile Oyun Önerileri
    - NLP Tabanlı Duygu Analizi (Sentiment Analysis)
  version: 1.0.0
  contact:
    name: Berkay
    email: bayarberkay032@gmail.com

servers:
  - url: [https://api.pixelcritic.net/v1](https://api.pixelcritic.net/v1)
    description: Production server
  - url: http://localhost:5000/api
    description: Development server

tags:
  - name: auth
    description: Kimlik doğrulama işlemleri (Kayıt, Giriş, Çıkış)
  - name: users
    description: Kullanıcı profili işlemleri
  - name: games
    description: Oyun keşfi ve listeleme
  - name: library
    description: Kişisel oyun kütüphanesi işlemleri
  - name: ratings
    description: Oyun puanlama işlemleri
  - name: reviews
    description: İnceleme yazma ve etkileşim işlemleri
  - name: ai
    description: Yapay zeka ve makine öğrenmesi modülleri

paths:
  /auth/register:
    post:
      tags:
        - auth
      summary: Yeni kullanıcı kaydı
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRegistration'
      responses:
        '201':
          description: Başarılı kayıt

  /auth/login:
    post:
      tags:
        - auth
      summary: Kullanıcı girişi
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginCredentials'
      responses:
        '200':
          description: JWT Token döner

  /auth/logout:
    post:
      tags:
        - auth
      summary: Güvenli çıkış yapma
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Oturum sonlandırıldı

  /auth/reset-password:
    post:
      tags:
        - auth
      summary: Şifre sıfırlama talebi
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
      responses:
        '200':
          description: Sıfırlama maili gönderildi

  /users/profile:
    get:
      tags:
        - users
      summary: Kendi profilini görüntüle
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profil detayları ve istatistikler
    put:
      tags:
        - users
      summary: Profil bilgilerini güncelle
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProfileUpdate'
      responses:
        '200':
          description: Profil güncellendi

  /users/{username}:
    get:
      tags:
        - users
      summary: Başka bir kullanıcının profilini görüntüle
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Herkese açık profil bilgileri

  /games:
    get:
      tags:
        - games
      summary: Oyun listesi, arama ve filtreleme
      parameters:
        - name: search
          in: query
          schema:
            type: string
        - name: genre
          in: query
          schema:
            type: string
        - name: platform
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Oyun listesi

  /games/{id}:
    get:
      tags:
        - games
      summary: Oyun detayı ve genel skor
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        '200':
          description: Oyun detayları

  /library:
    post:
      tags:
        - library
      summary: Kütüphaneye oyun ekle
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LibraryItemCreate'
      responses:
        '201':
          description: Oyun eklendi

  /library/{id}:
    put:
      tags:
        - library
      summary: Kütüphanedeki oyunun durumunu güncelle
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LibraryItemUpdate'
      responses:
        '200':
          description: Durum güncellendi
    delete:
      tags:
        - library
      summary: Oyunu kütüphaneden sil
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        '204':
          description: Başarıyla silindi

  /games/{id}/ratings:
    post:
      tags:
        - ratings
      summary: Oyuna puan ver (1-10)
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RatingData'
      responses:
        '201':
          description: Puan eklendi
    put:
      tags:
        - ratings
      summary: Verilen puanı güncelle
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RatingData'
      responses:
        '200':
          description: Puan güncellendi
    delete:
      tags:
        - ratings
      summary: Verilen puanı sil
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        '204':
          description: Puan silindi

  /games/{id}/reviews:
    get:
      tags:
        - reviews
      summary: Oyunun incelemelerini listele
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        '200':
          description: İnceleme listesi
    post:
      tags:
        - reviews
      summary: Oyuna inceleme yaz
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReviewCreate'
      responses:
        '201':
          description: İnceleme yayınlandı

  /reviews/{id}:
    put:
      tags:
        - reviews
      summary: Kendi incelemeni güncelle
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReviewCreate'
      responses:
        '200':
          description: İnceleme güncellendi
    delete:
      tags:
        - reviews
      summary: Kendi incelemeni sil
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        '204':
          description: İnceleme silindi

  /reviews/{id}/vote:
    post:
      tags:
        - reviews
      summary: İncelemeyi faydalı/faydasız olarak oyla
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                voteType:
                  type: string
                  enum: [upvote, downvote]
      responses:
        '200':
          description: Oy kaydedildi

  /ai/recommendations:
    get:
      tags:
        - ai
      summary: Kişiselleştirilmiş AI oyun önerileri al
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Makine öğrenmesi tarafından oluşturulan oyun listesi

  /ai/analyze-review:
    post:
      tags:
        - ai
      summary: İnceleme metnini NLP ile analiz et
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                content:
                  type: string
      responses:
        '200':
          description: Analiz sonucu (Pozitif, Negatif, Nötr)

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    IdParam:
      name: id
      in: path
      required: true
      schema:
        type: string
        format: uuid

  schemas:
    UserRegistration:
      type: object
      properties:
        username: { type: string }
        email: { type: string, format: email }
        password: { type: string }
        
    LoginCredentials:
      type: object
      properties:
        identifier: { type: string }
        password: { type: string }

    ProfileUpdate:
      type: object
      properties:
        bio: { type: string }
        avatarUrl: { type: string }

    LibraryItemCreate:
      type: object
      properties:
        gameId: { type: string }
        status: { type: string, enum: [played, playing, plan_to_play, dropped] }
        
    LibraryItemUpdate:
      type: object
      properties:
        status: { type: string, enum: [played, playing, plan_to_play, dropped] }

    RatingData:
      type: object
      properties:
        rating: { type: integer, minimum: 1, maximum: 10 }

    ReviewCreate:
      type: object
      properties:
        content: { type: string }

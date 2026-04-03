# Gereksinim Analizi
# Tüm Gereksinimler

1. __Hesap Oluşturma:__ <br><br>
   * ___Api Metodu:___ `POST /api/auth/register`
   * ___Açıklama:___ Kullanıcıların yeni hesaplar oluşturarak sisteme kayıt olmasını sağlar. Kullanıcılar geçerli bir e-posta adresi, benzersiz bir kullanıcı adı ve şifre belirleyerek hesap verilerini oluşturur.<br><br>
2. __Giriş Yapma:__<br><br>
   * ___Api Metodu:___ `POST /api/auth/login`
   * ___Açıklama:___ Kullanıcıların sisteme giriş yaparak hizmetlere erişmesini sağlar. Doğrulanmış e-posta adresi veya kullanıcı adı ile şifre eşleştirilerek kimlik doğrulama yapılır. Başarılı giriş sonrası kullanıcıya güvenli erişim tokenı (JWT) verilir.<br><br>
3. __Çıkış Yapma:__<br><br>
   * ___Api Metodu:___ `POST /api/auth/logout`
   * ___Açıklama:___ Kullanıcıların aktif oturumlarını güvenli bir şekilde sonlandırır ve mevcut erişim tokenını geçersiz kılar.<br><br>
4. __Şifre Sıfırlama:__<br><br>
   * ___Api Metodu:___ `POST /api/auth/reset-password`
   * ___Açıklama:___ Kullanıcıların unuttukları şifreleri için sıfırlama talebinde bulunmasını ve yeni şifre belirlemesini sağlar.<br><br>   
5. __Kendi Profilini Görüntüleme:__<br><br>
   * ___Api Metodu:___ `GET /api/users/profile`
   * ___Açıklama:___ Sisteme giriş yapmış kullanıcının kendi profil bilgilerini görüntülemesini sağlar. kütüphanesindeki toplam oyun ve yazdığı toplam inceleme sayısı detaylarıyla birlikte kullanıcıya sunulur.<br><br>
6. __Profil Bilgilerini Güncelleme:__<br><br>
   * ___Api Metodu:___ `PUT /api/users/profile`
   * ___Açıklama:___ Kullanıcının kendi profil hatlarını özelleştirmesini sağlar. Kullanıcılar bu uç nokta üzerinden sistemdeki görünür kullanıcı adlarını (username),profil fotoğraflarını değiştirebilir.<br><br>
7. __Oyunları Listeleme:__<br><br>
   * ___Api Metodu:___ `GET /api/games`
   * ___Açıklama:___ Kullanıcıların arama çubuğu üzerinden oyunları isimlerine göre aratmasını sağlar.<br><br>
8. __Oyunları Filtreleme:__<br><br>
   * ___Api Metodu:___ `GET /api/games/filter`
   * ___Açıklama:___ Kullanıcıların oyun listelerini belirli kriterlere göre daraltmasını sağlar. Oyunlar türlerine (Aksiyon, RYO vb.), çıkış yıllarına veya oynandıkları platformlara göre filtrelenerek kullanıcıya sunulur.<br><br>
9. __Oyun Detayı Görüntüleme:__<br><br>
   * ___Api Metodu:___ `GET /api/games/{id}`
   * ___Açıklama:___ Sistemdeki belirli bir oyunun kapak görseli, geliştirici bilgisi ve özet metnini içeren detaylarını getirir. Ayrıca o oyuna verilen tüm kullanıcı puanlarının ortalamasını hesaplayarak genel ortalama skoru da sunar.<br><br>
10. __Kütüphaneye Oyun Ekleme:__<br><br>
   * ___Api Metodu:___ `POST /api/library`
   * ___Açıklama:___ Kullanıcının ilgilendiği bir oyunu kişisel kütüphanesine almasını sağlar. İlk ekleme sırasında "Oynadıklarım", "Şu An Oynadıklarım", "Oynayacaklarım" veya "Bıraktıklarım" durumlarından biri atanır.<br><br>
11. __Kütüphane Durumunu Güncelleme__<br><br>
   * ___Api Metodu:___ `PUT /api/library/{id}`
   * ___Açıklama:___ Kullanıcının kişisel kütüphanesinde bulunan bir oyunun mevcut durum etiketini (örneğin "Oynayacaklarım"dan "Oynadıklarım"a) sonradan güncellemesini sağlar.<br><br>
12. __Kütüphaneden Oyun Silme__<br><br>
   * ___Api Metodu:___ `DELETE /api/library/{id}`
   * ___Açıklama:___ Kullanıcının kütüphanesine eklediği oyunları listeden tamamen çıkarmasını sağlar.<br><br>
13. __Oyuna Puan Verme:__<br><br>
   * ___Api Metodu:___ `POST /api/games/{id}/ratings`
   * ___Açıklama:___ Kullanıcının bir oyuna 1 ile 10 arasında sayısal bir puan vererek değerlendirmesini sağlar.<br><br>
14. __Oyun Puanını Güncelleme:__<br><br>
   * ___Api Metodu:___ `PUT /api/games/{id}/ratings`
   * ___Açıklama:___ Kullanıcının bir oyun için daha önceden vermiş olduğu puanı yeni bir değerle değiştirmesini sağlar.<br><br>
15. __Oyun Puanını Silme:__<br><br>
   * ___Api Metodu:___ `DELETE /api/games/{id}/ratings`
   * ___Açıklama:___ Kullanıcının bir oyuna verdiği puanı sistemden tamamen silmesini sağlar. Oyunun genel ortalaması bu işlemden sonra otomatik olarak yeniden hesaplanır.<br><br>
16. __İnceleme Yazma:__<br><br>
   * ___Api Metodu:___ `POST /api/games/{id}/reviews`
   * ___Açıklama:___ Kullanıcının oyunlar hakkında metin tabanlı serbest incelemeler oluşturmasını ve yayınlamasını sağlar.<br><br>
17. __İncelemeleri Listeleme:__<br><br>
   * ___Api Metodu:___ `GET /api/games/{id}/reviews`
   * ___Açıklama:___ Oyun detay sayfasında ilgili oyuna ait tüm incelemelerin listelenmesini sağlar. Diğer üyelerin (kullanıcı adlarıyla birlikte) paylaştığı inceleme metinleri okuyucuya sunulur.<br><br>
18. __İncelemeyi Güncelleme:__<br><br>
   * ___Api Metodu:___ `PUT /api/reviews/{id}`
   * ___Açıklama:___ Kullanıcının kendi yazdığı inceleme metnini sonradan düzenlemesini sağlar.<br><br>
19. __İncelemeyi Silme:__<br><br>
   * ___Api Metodu:___ `DELETE /api/reviews/{id}`
   * ___Açıklama:___ Kullanıcının kendi yazdığı incelemeyi sistemden tamamen silmesini sağlar.<br><br>
20. __İncelemeye Oy Verme:__<br><br>
   * ___Api Metodu:___ `POST /api/reviews/{id}/vote`
   * ___Açıklama:___ Kullanıcının başkalarının yazdığı incelemelere "Faydalı" veya "Faydasız" şeklinde oy vererek etkileşimde bulunmasını sağlar.<br><br>
21. __Diğer Kullanıcıların Profilini Görüntüleme:__<br><br>
   * ___Api Metodu:___ `GET /api/users/{username}`
   * ___Açıklama:___ Kullanıcıların, platformdaki diğer üyelerin herkese açık profil bilgilerini görüntülemesini sağlar. Bu uç nokta üzerinden ilgili kullanıcının biyografisi, kütüphanesindeki oyunların listesi ve platformda yazdığı tüm incelemeler çekilerek listelenir.<br><br>
22. __AI Destekli Kişiselleştirilmiş Oyun Önerileri:__<br><br>
   * ___Api Metodu:___ `GET /api/ai/recommendations`
   * ___Açıklama:___ Kullanıcının kütüphanesinde bulunan oyunların türleri, etiketleri ve verdiği yüksek puanlar (8-10 arası) analiz edilerek arka planda çalışan bir makine öğrenmesi modeli (Örn: Content-Based Filtering) aracılığıyla o kullanıcıya özel "Bunları da Sevebilirsin" listesi oluşturur ve sunar.<br><br>
23. __AI Tabanlı İnceleme Duygu Analizi:__<br><br>
   * ___Api Metodu:___ `POST /api/ai/analyze-review`
   * ___Açıklama:___ Kullanıcıların oyunlar için yazdığı uzun inceleme metinlerini veritabanına kaydetmeden önce Doğal Dil İşleme (NLP) teknikleriyle analiz eder. Yazılan metnin içeriğine göre sisteme otomatik olarak "Pozitif", "Negatif" veya "Nötr" şeklinde bir duygu etiketi (sentiment tag) döndürür ve bu etiket incelemeyle birlikte kaydedilir.<br><br>     
   

  

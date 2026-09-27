# TikTok Kura

TikTok takipçi çekilişi için Vite + React uygulaması.

## Admin

Yönetim paneli `/admin` adresinden açılır ve kullanıcı adı + şifre ile korunur. Giriş ekranında herhangi bir varsayılan kimlik bilgisi gösterilmez ve otomatik/kısayol giriş bulunmaz.

## Özellikler

- Gerçek katılımcı listesi; başlangıçta sahte takipçi/veri yoktur.
- Gerçek kura akışı ve çekiliş geçmişi; başlangıçta sahte geçmiş yoktur.
- Tekil kullanıcı hakkı ve otomatik tekrar temizleme.
- Kara liste yönetimi.
- Katılımcının kayıtlı TikTok kullanıcı adını düzeltme özelliği.
- Admin oturumu için `sessionStorage` kullanımı.

> Not: Bu proje Vercel üzerinde istemci tarafında çalışan bir uygulamadır. Admin doğrulaması frontend tarafında hash karşılaştırmasıyla yapılır; gerçek sunucu taraflı kimlik doğrulama için Supabase Auth veya ayrı bir backend eklenmesi gerekir.

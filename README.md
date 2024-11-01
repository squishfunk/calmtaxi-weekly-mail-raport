# Calmtaxi Weekly Mail Report

Automatyczny system generujący cotygodniowe raporty z działalności przewozowej na podstawie danych pobieranych z API Bolt (przewóz osób) oraz wysyłający raporty na wybrane adresy email.

## Wymagania

- Node.js v14 lub wyższy
- Konto w serwisie Bolt z dostępem do API
- Konto email do wysyłania raportów

## Instalacja

1. Sklonuj repozytorium:
```bash
   git clone https://github.com/your-username/calmtaxi-weekly-mail-raport.git
```
3. Przejdź do katalogu projektu:
```bash
   cd calmtaxi-weekly-mail-raport
```
5. Zainstaluj zależności:
```bash
   npm install
```
## Konfiguracja

Projekt wymaga utworzenia pliku `.env` w katalogu głównym projektu, który zawierać będzie dane autoryzacyjne oraz hasło emailowe. W katalogu znajdziesz plik `.env.example` jako przykład.

1. Utwórz plik `.env`:
```bash
   touch .env
```
3. Dodaj następujące zmienne środowiskowe do pliku `.env`:
```env
   CLIENT_ID=your_bolt_client_id  
   CLIENT_SECRET=your_bolt_client_secret  
   EMAIL_PASSWORD=your_email_password  
```
   - `CLIENT_ID` i `CLIENT_SECRET` to dane autoryzacyjne dla API Bolt.
   - `EMAIL_PASSWORD` to hasło do konta email używanego do wysyłania raportów.

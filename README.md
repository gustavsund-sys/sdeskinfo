# Service desk informationsskärm

En robust informationsskärm för Service desk vid Örebro universitet. Den publika sidan på `/display` spelar en bildpresentation i loop och delar automatiskt ytan med tidsstyrd information. Det autentiserade gränssnittet på `/admin` hanterar meddelanden, förhandsvisning och skärminställningar.

## Arkitektur

- React, Vite och TypeScript som statisk SPA
- Firebase Authentication med e-post/lösenord för administratörer
- Cloud Firestore för inställningar, meddelanden och skärmens heartbeat
- Firestore persistent lokal cache för fortsatt drift vid nätavbrott
- GitHub Pages med automatisk publicering från `main`
- Samma `DisplayCanvas` används av både `/display` och adminförhandsvisningen

Tider sparas som Firestore `Timestamp`. Webbläsarens `datetime-local` konverteras till en absolut tidpunkt och presentationen formaterar svensk tid med `Europe/Stockholm`, vilket gör schemaläggningen robust även vid sommar- och vintertid.

## Lokal installation

Krav: Node.js 20 eller senare.

```bash
npm install
npm run dev
```

Öppna `http://localhost:5173/display` eller `http://localhost:5173/admin`.

Kontrollera projektet med:

```bash
npm test
npm run build
```

## Firebase-konfiguration

Klientkonfigurationen för projektet `sdeskinfo-c7941` finns i `src/firebase.ts`. Detta är publik Firebase-klientmetadata, inte ett administratörslösenord.

1. Öppna Firebase Console och välj projektet.
2. Aktivera **Firestore Database**.
3. Aktivera **Authentication → Sign-in method → Email/Password**.
4. Skapa administratören manuellt under **Authentication → Users → Add user**. Appen erbjuder ingen registrering.
5. Kopiera `.env.example` till `.env.local` och ange samma kontos e-postadress som `VITE_ADMIN_EMAIL`.
6. Publicera reglerna med `firebase deploy --only firestore:rules`.

Adminformuläret visar endast lösenordsfältet. Firebase kräver fortfarande en e-postadress som kontoidentifierare, men den läses från `VITE_ADMIN_EMAIL` och fylls i automatiskt bakom kulisserna. Adressen är klientkonfiguration och ska inte betraktas som en hemlighet; lösenordet lagras aldrig i projektet.

### Firestore-data

`settings/display` skapas när inställningar sparas. Saknas dokumentet används säkra standardvärden.

```json
{
  "slideDuration": 10,
  "transitionDuration": 800,
  "messageRotationTime": 10,
  "infoPanelWidth": 34,
  "presentationId": "",
  "presentationName": "",
  "slides": []
}
```

Meddelanden finns i `messages/{id}`. `displayStatus/main` uppdateras av displayen högst en gång per minut.

## Säkerhet

`firestore.rules` ger publiken läsbehörighet till displayinställningar och meddelanden. Endast det uttryckligen angivna Firebase-UID:t får ändra dessa. Heartbeat får endast skriva fälten `lastSeen` och `version`; läsning av status kräver det godkända administratörskontot. Alla andra dokument nekas som standard. Om administratörskontot byts måste UID:t i regelfunktionen `isAdmin()` uppdateras före nästa publicering.

Publicera alltid reglerna tillsammans med appen. Firebase API-nyckeln ska inte användas som hemlighet. Administratörslösenord ska aldrig läggas i källkod, `.env`, Firestore eller `localStorage`.

## Presentation och slides

Under **Admin → Presentation** kan administratören välja en `.pptx`-fil direkt. Appen delar filen i Firestore-säkra delar, laddar upp dem, byter aktiv presentation först när hela filen är färdig och tar därefter bort den tidigare versionen. Maximal filstorlek är 25 MB. Displayen hämtar delarna och renderar PowerPoint-presentationen direkt i webbläsaren.

Presentationen spelas automatiskt i loop med den konfigurerade slide-tiden och skalas med `contain` så att inget beskärs. Om ingen presentation är uppladdad visas en neutral, textfri bakgrund. Publika bild-URL:er finns kvar som ett avancerat reservläge.

## Användning

- `/display`: öppnas i helskärm på informationsskärmen. Inga reglage visas.
- `/admin`: logga in, se skärmstatus, aktiva och kommande meddelanden.
- `/admin/new`: förhandsvisa, schemalägg eller publicera direkt i 30 minuter, 1 timme, resten av dagen eller till egen sluttid/tills vidare.
- `/admin/settings`: sidan **Presentation**, där PowerPoint laddas upp och tider samt panelbredd ändras med liveförhandsvisning.

Flera aktiva meddelanden roterar. `important` får en tydligare markering och `urgent` använder 65 procent av skärmen. När sista meddelandet löper ut återgår presentationen mjukt till helskärm.

## Demo och utveckling

Tre lokala exempel finns i `src/lib/demo.ts` för komponentutveckling och tester. De används inte automatiskt i produktion; produktionsdata kommer alltid från Firestore. Presentationen innehåller inga exempelbudskap i produktionsläget.

## Driftsättning till GitHub Pages

Workflow-filen `.github/workflows/deploy-pages.yml` testar, bygger och publicerar appen automatiskt när `main` uppdateras. GitHub Pages ska använda **GitHub Actions** som källa under repositoryts **Settings → Pages**.

- Display: `https://gustavsund-sys.github.io/sdeskinfo/display`
- Admin: `https://gustavsund-sys.github.io/sdeskinfo/admin`

Bygget använder `/sdeskinfo/` som bas på GitHub Actions och skapar en `404.html`-fallback, så direkta länkar till `/display`, `/admin` och `/admin/settings` fungerar. Lägg till `gustavsund-sys.github.io` under **Firebase Authentication → Settings → Authorized domains** för att tillåta inloggning från GitHub Pages.

## Spark-plan och drift

Lösningen kräver inga Cloud Functions, Cloud Run eller externa betaltjänster. Displayen har en Firestore-lyssnare för inställningar och en för meddelanden. Heartbeat skrivs en gång per minut. Bildfiler levereras av GitHub Pages och Firestore-cachen gör att senast kända data kan visas vid nätavbrott. Detta håller läsningar och skrivningar låga och är utformat för Firebase Spark-planen.

## Visuell riktning

Gränssnittet använder en återhållen svartvit universitetskaraktär, tydlig rubrikhierarki och stora luftiga ytor. ORU:s dokumenterade avhandlingsmall använder Trade Gothic Next och Sabon Next; eftersom de inte distribueras fritt använder appen systemnära Arial och Georgia i stället. Färger för status och prioritet är funktionella och kompletteras alltid med text, så färg är aldrig enda informationsbärare.

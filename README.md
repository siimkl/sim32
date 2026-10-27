# AI kasvatab võimekust. Ettevõte kasvatab lubadusi.

## Veebis avaldamine

Rakendus avaldatakse `main` haru iga muudatuse järel automaatselt GitHub Pagesi kaudu. Töövoog käivitab mudelitestid, loob Vite'i produktsiooniversiooni ning avaldab `dist` kausta. Repositooriumi **Settings → Pages → Build and deployment** all peab allikaks olema valitud **GitHub Actions**.

Eestikeelne Reacti ja SVG-ga õppewidget. Üks põhjuslik ahel: AI annab töötajatele ja automaatikale lisavõimekust → ettevõte avab uusi teenuseid → AI katkeb, kuid lubatud töö jääb alles.

## Käivitamine

```sh
npm install
npm run dev -- --port 5332
```

Aadress: http://127.0.0.1:5332. `npm run build` koostab kausta `dist`.

## Läbimäng

1. Vali AI võimendus ja vajuta „Kasvata organisatsiooni”. Täielik läbimäng kestab 20 sammu: 10 kasvusammu ja 10 katkestuse leviku sammu. Üks samm kestab ühe sekundi ning simulatsiooni saab peatada ja jätkata.
2. Vaata, kuidas lisanduvad ööpäevaringne teenindus, personaalsed pakkumised ja kiirteenindus. Organisatsioon peatub automaatselt, kui on valitud AI tasemega kohanenud.
3. Vajuta „Katkesta AI tugi”. Töövõime langeb esimesena; järgmistel sammudel jõuab mõju teenusteni. Lubatud töömaht ei vähene.
4. Soovi korral vajuta „Alusta uuesti” ja katseta teist AI taset või valdkonda.

## Valdkonnad

Valdkonnakaardil saab valida avaliku sektori, hariduse, IT, julgeoleku, kaubanduse, logistika, tervishoiu korralduse, tööstuse või valdkondadeülese sõltuvusahela. Valdkonna vahetamine peatab jooksva katse ja viib algseisu. AI liuguri valik säilib.

Igal sektoril on oma töötajate rollid, automaatika, viis tegevust, lubadused ning hilinemise ja seiskumise kirjeldused. Arvulised eeldused on üksiksektorites samad: võrdleme mehhanismi, mitte valdkondade tegelikku riski. Tervishoiunäide käsitleb haldust ja vastuvõttude korraldust.

„Ühiskond tervikuna” näites eristatakse olemasolevaid põhiteenuseid ja nende peale ehitatud AI-juhtimiskihti. Digitaristu ning maksed toimivad enne AI-d; AI lisab viis uut võimekust: ennetava ühiskondlike riskide seire, kriitiliste varude dünaamilise jaotuse, ravi- ja hoolekandevõime ühise juhtimise, reaalajas kohaliku kriisiabi ning isikupõhised hoiatused. Iga uus võimekus sõltub varasema lüli väljundist. Lüli lühike puhver lükkab mõju edasi ja järgmine lisavõimekus vajab vähemalt 95% eelmise lüli lubatud mahust. Täieliku katkestuse järel põhiteenused aeglustuvad, kuid viis AI peale ehitatud lisavõimekust seiskuvad. See on illustratiivne, teadlikult range ühiskondliku sõltuvusahela eeldus.

## Arvulised eeldused

Algne töövõime ja lubatud töömaht on mõlemad 100. Täieliku AI võimendusega kasvab võimekus 310-ni ja kohustused 280-ni. Täieliku katkestuse järel säilib 78 ühikut võimekust: 202 ühiku võrra vähem kui lubatud töö. Kaks senist teenust hilinevad ja kolm uut teenust seiskuvad.

Kohanemine loob uusi lubadusi. Selle käigus on vähendatud AI-ta töövõime varu, mistõttu katkestuse järel ei naasta automaatselt algtasemele. Senine töö saab jaotamisel eelisjärjekorra; uued teenused sõltuvad ka varasemate teenuste toimimisest. Lühike teenuste puhver näitab, et mõju jõuab töövõime langusest teenuste seiskumiseni viivitusega.

Arvud on õpetlikud eeldused, mitte prognoos.

## Failid ja kontrollid

- `src.jsx`: juhtimine ja põhivõrdlus „Suudame teha / Oleme lubanud teha”.
- `StoryScene.jsx`: AI allikas, töötajad, automaatika ja teenused.
- `story-model.js`: sammud, kohanemine, püsivad kohustused ja katkestuse levik.
- `sectors.js`: üheksa valdkonna tekstid ja tegevused.
- `story.css`: ühe ekraani töölauavaade ning mobiilipaigutus.
- `npm test`: mudeli käitumise kontrollid.
- `node browser-check.mjs`: kohaliku serveri ja Chrome'iga kasv, paus, teenuste lisandumine, katkestuse levik ja paigutus.
- `node sector-check.mjs`: kõik valdkonnad, tekstivahetus, lähtestamine, seitsme lüli kaupa leviv katkestus ja paigutus.

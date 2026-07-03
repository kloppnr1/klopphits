# KloppHits 🎮📺

Big screen-software til stuen: se dine **private billeder og videoklip**, start dine **Steam-spil** og spil **online retro-spil** — alt sammen styret **udelukkende med en controller** (10-foot UI, som Steam Big Picture).

Bygget med [Electron](https://www.electronjs.org/) og browserens Gamepad API. Ingen mus eller tastatur nødvendig.

## Funktioner

- **🖼️ Billeder** — gennemse en valgfri mappe (inkl. undermapper) i et flisegitter, åbn i fuld skærm og start diasshow.
- **🎬 Videoklip** — gennemse videoer med miniaturer, afspil i fuld skærm med pause, spol (±10 sek.), lydstyrke og næste/forrige klip.
- **🎮 Steam** — scanner automatisk dit installerede Steam-bibliotek (Windows, Linux inkl. Flatpak, macOS) og viser spillene med coverbilleder. Tryk A for at starte spillet via Steam. Y åbner Steam Big Picture.
- **👾 Retro Spil** — kuraterede online retro-platforme (Internet Arcade, Console Living Room, MS-DOS Games, itch.io) åbnes i fuld skærm. De fleste web-emulatorer understøtter controlleren direkte. **Hold SELECT + START i 1 sekund** for at vende tilbage til KloppHits.
- **⚙️ Indstillinger** — vælg billed- og videomappe med en controller-venlig mappevælger. Gemmes i din brugerprofil.

## Koncept-UI (live demo)

Konceptet for stil og primær navigation ligger som statisk side i `docs/` og deployes automatisk til GitHub Pages:

**https://kloppnr1.github.io/klopphits/**

Navigér med controller eller tastatur (piletaster, Enter = A, Esc = B).

## Kom i gang

Kræver [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm start
```

Appen starter i fuld skærm. Til udvikling kan du starte i vindue:

```bash
npm run start:windowed
```

## Styring

| Knap | Funktion |
|---|---|
| D-pad / venstre stik | Navigér |
| **A** | Vælg / Åbn / Pause-Afspil |
| **B** | Tilbage |
| **X** | Vælg mappe (i mappevælger) / Forrige klip (i afspiller) |
| **Y** | Steam Big Picture (i Steam) / Næste klip (i afspiller) |
| **SELECT + START** (hold 1 sek.) | Luk retro-spil og vend tilbage |

Tastatur virker som reserve under udvikling (piletaster, Enter = A, Esc = B, X/Y).

## Konfiguration

Indstillinger gemmes i `config.json` under Electrons brugerdata-mappe (fx `~/.config/klopphits/config.json` på Linux). Her kan du også redigere listen af retro-sider (`retroSites`) med `name`, `description` og `url`.

## Understøttede formater

- **Billeder:** JPG, PNG, GIF, WebP, AVIF, BMP
- **Video:** MP4, M4V, WebM, MOV (MKV vises, men afspilning afhænger af codec)

## Design

Skandinavisk og roligt: kølig grafit-baggrund, flade paneler med hårfine kanter, dæmpet nordisk isblå accent og rene SVG-stregikoner. Hjemmeskærmen har en levende, nedtonet baggrund, der stille skifter mellem dine egne billeder. Skærmskift glider blødt ind, og fokusringen er tydelig på sofaafstand. Alle animationer respekterer `prefers-reduced-motion`.

## Optimeret til 55–75" TV

- Hele UI'et skalerer med skærmhøjden (`rem` bundet til `vh`), så det ser ens ud på 1080p og 4K TV.
- Tekst- og flisestørrelser er valgt til læsbarhed på 2–3 meters sofaafstand.
- Overscan-sikre marginer (5 % vandret, 2,5 % lodret), så intet beskæres på TV'er med overscan. Slå evt. "Just Scan" / "Ren scanning" til i TV'ets billedindstillinger for skarpest resultat.
- Høj kontrast på sekundær tekst og tydelig blå fokusring, så markeringen altid kan ses på afstand.

## Tips til HTPC-brug

- Sæt appen til at starte automatisk ved login, så tv'et boot'er direkte ind i KloppHits.
- Steam-spil startes gennem Steam — brug Steam-overlayet (Guide-knappen) til at lukke spil igen.

# Arjun & Meera — Guruvayur 3D Wedding Invitation

An immersive, scroll-driven 3D wedding invitation set in a procedural Guruvayur Sri Krishna Temple.
Built with Next.js (App Router) · React Three Fiber · drei · postprocessing · GSAP ScrollTrigger · Lenis · Tailwind CSS v4 · Framer Motion.

**No external 3D models, images or audio files are required.** All architecture, textures and sound are generated in code.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Requires Node 18.18+ (Node 20/22 recommended). Deploys to Vercel as-is.

## Personalise

Edit **`constants/weddingData.ts`** only:

| Constant | What it controls |
|---|---|
| `COUPLE` | Names, full names, parents, hashtag |
| `WEDDING` | Display date, Malayalam month, gate date |
| `EVENTS` | Muhurtham / Sadhya / Reception — times (ISO with +05:30) drive the calendar links |
| `VENUE` | Venue name, address, Google Maps link and embed |
| `DRESS_CODE` | Dress-code card |
| `RSVP` | `endpoint` (JSON POST, e.g. Formspree or Google Apps Script). Leave empty to send RSVPs via WhatsApp to `whatsappNumber` |
| `BLESSING` | Sanskrit / Malayalam invocation, final blessing, gratitude note |
| `AUDIO` | Optional licensed track URL (put an mp3 in `/public`); empty = synthesised soundscape |

## Project structure

```
app/
  layout.tsx            fonts, metadata, Lenis CSS
  page.tsx              loader → scene → scroll track → overlays
  globals.css           Tailwind theme (Kasavu gold / maroon), glass cards
components/
  TempleScene.tsx       Canvas, lighting, environment, Bloom + ToneMapping + Vignette
  TempleArchitecture.tsx Gopuram & teak doors, Deepasthambham, corridor pillars,
                        jasmine garlands, Thoranam, Kodimaram, Vilakkumatam lamp walls,
                        Nalambalam gate, Namaskara Mandapam, Sparkles
  VigrahamSanctum.tsx   Sreekovil with golden roof, Vigraham, Prabhavali, divine rays
  ScrollCameraRig.tsx   CatmullRom camera path, dwell at milestones, mouse parallax
  InvitationOverlays.tsx Gate seal, cards (0.15 / 0.40 / 0.65 / 0.90), RSVP, rail, sound toggle
  LoadingScreen.tsx     Rotating brass Nilavilakku progress loader
  three/                Flames (instanced shader), Nilavilakku, Instanced helpers
lib/
  cameraPath.ts         21-point path + scroll→curve remapping
  textures.ts           procedural canvas textures (teak, granite, laterite, murals…)
  materials.ts          shared PBR materials
  geometry.ts           Kerala hip roof, Mukhappu gable, Kalasam, bell
  templeAudio.ts        Web Audio bells, tanpura drone, Nadaswaram-style reed, Om chant
  smoothScroll.ts       Lenis ↔ ScrollTrigger bridge, scroll lock until doors open
  calendar.ts           Google Calendar + .ics
  invitationCard.ts     downloadable 1200×1800 PNG invitation
  store.ts              zustand state, milestones, quality tier
constants/weddingData.ts
```

## Performance notes

- All repeated objects (≈2,800 Vilakkumatam flames on desktop, lamp cups, jasmine florets, pillars, studs) are `InstancedMesh` draw calls; flames animate entirely in a vertex shader.
- Phones / small screens get a `low` tier automatically: fewer lamps and garland florets, fewer point lights, no MSAA, lower DPR. `PerformanceMonitor` lowers DPR further if the frame rate drops.
- Touch devices use native momentum scrolling (Lenis `syncTouch: false`) for a reliable mobile fallback.

## Notes

- The Vigraham is a stylised, abstract representation crafted with respect. If the family prefers, it can be hidden by removing `<Vigraham />` in `VigrahamSanctum.tsx`; the glowing sanctum and lamps remain.
- Temple weddings at Guruvayur take place in the Kalyana Mandapams at East Nada; booking and timings are arranged with the Guruvayur Devaswom.

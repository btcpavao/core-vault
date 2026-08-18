# ER-12A — Performance i runtime sanity

Datum: 2026-08-18  
Artifact: `Core Vault ER12A QA.app`  
Okruženje: packaged foreground Tauri, DPR 1, 1240×820 prozor, lokalni izolirani Bitcoin Core regtest na RPC portu 19443, visina 105.

## Sažetak

**PERFORMANCE GATE: PASS**

ER-12A ostaje praktično u ER-11b klasi fluidnosti. Svaki obavezni packaged foreground scenarij mjeri približno 60 FPS. Nema frameova iznad 50 ms, a najgori zabilježeni pojedinačni frame bio je 45 ms u jednoj warm-transition snimci.

## Packaged foreground A–F

| Scenarij | Namjena | FPS | Avg ms | Median | P95 | P99 | Max | >33,3 ms | Calls | Geom. | Tex. |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | idle hero | 60,042 | 16,655 | 17 | 25 | 31 | 32 | 0 | 50,65 | 67 | 20 |
| B | camera movement | 59,875 | 16,701 | 17 | 18 | 19 | 31 | 0 | 45,12 | 68 | 20 |
| C | reactor close-up | 59,998 | 16,667 | 17 | 18 | 18 | 23 | 0 | 44,94 | 68 | 20 |
| D | inactive/dormant | 59,933 | 16,685 | 17 | 27 | 30 | 31 | 0 | 50,43 | 67 | 20 |
| E | reduced motion | 59,871 | 16,703 | 17 | 27 | 30 | 34 | 1 | 50,65 | 67 | 20 |
| F | console view | 59,873 | 16,702 | 17 | 27 | 31 | 34 | 1 | 35,60 | 68 | 20 |

Napomena: autorun je sadržavao i warm transition uzorak s 59,888 FPS i jednim 45 ms frameom; nije pokazao održivi hitch niti frame iznad 50 ms.

## Trošak u odnosu na ER-11b

- ER-11b report: 59,37–60,01 FPS, 66 geometrija, 5 tekstura, 10 programa.
- ER-12A packaged: 59,87–60,04 FPS, najviše 68 geometrija i 20 tekstura.
- Delta: +2 renderer geometrije i +15 tekstura; FPS nije mjerljivo degradiran izvan normalne varijance.
- Dodatne teksture su postojeće determinističke DataTexture PBR mape i jedan 192×192 glow; nema mrežnih ni novih disk asset fetchova.

## 10× lifecycle

Ponovljeno je 10 ulazaka, inspect reactor, inspect console, povrataka i izlazaka, zatim final return.

- status: `complete`
- lifecycle zapisi: 22
- production mounts/unmounts: 12 / 11 (final room namjerno ostaje mounted)
- runtime scene builds: 13
- console surfaces created/disposed: 13 / 11 (aktivna scena i jedan stabilni owner ostaju živi)
- runtime material disposals: 528
- renderer pri leave: 229 geometrija / 20 tekstura / 13 programa
- renderer pri mounted/final return: 232 geometrije / 22 teksture / 22 programa
- rasponi su se ponovili bez monotoničkog rasta; local Environment i SH probe ostali su na stabilnom Canvas ownershipu.

## Runtime truthfulness

- Ready: potvrđen na stvarnom regtestu, chain `regtest`, height 105, sync 100%.
- Syncing: derivacijski test potvrđuje jači, brži state-driven intenzitet.
- Offline/unknown/dormant: main i secondary energy potpuno se gase.
- Network disabled: na izoliranom regtestu `setnetworkactive false` vratio je `networkactive:false`, nakon čega je `setnetworkactive true` vratio `networkactive:true`; main energy ostaje aktivan, a network-owned secondary glow se gasi neovisno.
- New block pulse: generiran je jedan stvarni regtest blok (height 105 → 106, hash `1949beb5…84cb`); zadržan je kratki 1,35 s pulse preko postojećeg `validationPulseSerial`, bez dekorativnog lažnog blocka.
- Reduced motion: stanje ostaje čitljivo, kontinuirani pulse je isključen.
- Reconnect: reactor sprites, scene root i environment nisu vezani za connection key; promjena node statusa ne rekonstruira scenu.

Truth assertions prolaze u `tests/experience/productionEngineRoom.test.ts` i `tests/experience/reactorEnergyState.test.ts`. Backend, wallet i RPC kod nisu mijenjani.

## Regression safety

`npm run verify`: **PASS**

- TypeScript / cargo fmt / clippy: PASS
- Vitest: 10 datoteka, 84/84 testa PASS
- Vite production build: PASS
- Rust: 68 PASS, 0 FAIL, 4 očekivano ignored real-bitcoind regtest testa

## Zaključak

ER-12A performance, lifecycle, truthfulness i regression gateovi prolaze. Ukupni ER-12A rezultat ipak ostaje creative FAIL iz razloga dokumentiranih u `ER-12A-CREATIVE-FIDELITY.md`.

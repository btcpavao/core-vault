# Contributing to Core Vault UI

Core Vault je eksperimentalni Signet projekt s malom sigurnosnom površinom. Promjena koja
širi mreže, policyje ili pristup privatnim ključevima nije običan feature PR.

## Prije izmjene

1. pročitajte `SECURITY.md`, `ARCHITECTURE.md` i relevantni dio `DESIGN_RESEARCH.md`
2. potvrdite da operaciju ne može sigurnije obaviti sam Bitcoin Core
3. navedite novi security invariant, RPC površinu i failure state
4. koristite isključivo sintetičke Signet podatke u issueovima i testovima

## Pravila koda

- React ne konstruira descriptore ni RPC zahtjeve
- Rust ponovno validira svaki sigurnosno važan frontend argument
- RPC ostaje loopback-only, bez redirecta i proxyja
- private key, seed, cookie, passphrase, PSBT i raw hex ne smiju u log/test fixture
- novi policy dobiva zaseban mali builder i testove; V1 uvjeti se ne generaliziraju unaprijed
- dependencies se dodaju samo uz obrazloženje potrebe i audit

## Obavezna provjera

```sh
npm run verify
npm audit
npm run tauri build
```

Za UX promjene prođite safe demo tipkovnicom, provjerite 700 px široki prikaz, reduced
motion i ažurirajte `DESIGN_AUDIT.md` ako se mijenja glavni flow.

## Sigurnosne prijave

Ne otvarajte javni issue koji sadrži stvarni wallet, backup, seed, key, cookie, passphrase,
PSBT ili transaction hex. Opišite problem sintetičkim Signet primjerom i minimalnim koracima.

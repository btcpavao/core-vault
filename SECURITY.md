# Sigurnosni ustav Core Vault UI-ja

> Ovaj dokument opisuje sačuvani 2-od-3 Signet prototip. Aktualni sigurnosni ugovor prostorne verzije i Personal Vaulta nalazi se u [docs/SECURITY_THREAT_MODEL.md](docs/SECURITY_THREAT_MODEL.md).

Core Vault UI je lokalni grafički sloj iznad Bitcoin Corea. Bitcoin Core je jedini izvor
istine i jedina komponenta koja generira ili koristi privatne ključeve.

## Aplikacija nikada ne smije

- generirati, čitati, izvoziti ili spremati privatne ključeve
- tražiti seed phrase, WIF, xprv ili tprv
- implementirati kriptografiju, signing engine ili descriptor checksum
- slati Bitcoin podatke, credentiale ili telemetriju na mrežni servis
- koristiti cloud backend, account, analytics, remote signer, Electrum ili remote Core
- omogućiti Mainnet u V1

## Tehnički enforceane kontrole

- RPC host mora biti loopback (`127.0.0.1`, `localhost` ili `::1`).
- `getblockchaininfo.chain` mora biti `signet` prije bilo koje wallet mutacije.
- Signing wallet mora imati `descriptors=true` i `private_keys_enabled=true`.
- Coordinator mora imati `descriptors=true` i `private_keys_enabled=false` prije importa.
- `listdescriptors` se poziva s `private=false`; private-key uzorak odmah prekida tijek.
- Receive/change descriptori moraju biti javni `wpkh`, ranged `/0/*` i `/1/*` parovi.
- K1/K2/K3 moraju imati različite master fingerprinte i tpubove.
- `getdescriptorinfo` mora potvrditi `isrange`, `issolvable` i `hasprivatekeys=false`.
- Oba `importdescriptors` rezultata moraju imati `success=true`.
- Public backup prije zapisa prolazi ponovni backend secret scan.
- PSBT i raw transaction postoje samo u memoriji procesa; UI ih ne persistira niti traži ručni copy/paste.
- Enkriptirani signer otključava se na najviše pet sekundi i backend nakon pokušaja uvijek poziva `walletlock`.

## Tajne

Bitcoin Core cookie čita samo Rust sloj i ne izlaže ga Reactu. Wallet passphrase šalje se
samo lokalnom Core RPC-u, nikada se ne upisuje u trace ili error poruku i briše se iz
frontend inputa odmah po dovršetku poziva. Zbog kopija koje mogu nastati u OS-u, Tauri
IPC-u i HTTP biblioteci nije moguće obećati savršeno brisanje svake memorijske kopije;
V1 smanjuje trajanje i broj kopija te taj podatak nikada ne persistira.

## Lokalni filesystem

Signing-wallet backup izrađuje Bitcoin Core putem `backupwallet`; aplikacija bira samo
apsolutnu ciljnu putanju i potvrđuje da je datoteka nastala. Public vault backup sadrži
isključivo schema verziju, Signet policy, javne fingerprinte/tpubove, checksummed receive
i change descriptore te coordinator metadata.

## Poznate granice

V1 ne štiti kompromitiran OS, Bitcoin Core instalaciju ili korisnički odabranu backup
lokaciju. `tpub` sam po sebi ne razlikuje Signet od Testneta, zato se mreža uvijek provjerava
izravno kroz lokalni `getblockchaininfo`, a descriptor obrada nije dostupna bez te provjere.

Kreiranje i enkripcija signing walleta u V1 su dva odvojena, blokirajuća wizard koraka.
Naglo gašenje aplikacije između njih može ostaviti lokalni Signet wallet neenkriptiranim;
zato se ovaj prototip ne koristi za stvarni bitcoin. Prije Mainnet dizajna ta dva koraka
moraju postati jedna atomska Core operacija ili dobiti siguran resumable recovery flow.

Sigurnosne probleme prijavite sa sintetičkim Signet podacima. Nikada ne prilažite wallet
datoteke, seed, private key, passphrase ili stvarni PSBT.

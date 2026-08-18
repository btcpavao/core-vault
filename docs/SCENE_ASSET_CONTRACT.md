# Ugovor za originalne scene i artefakte

Slike iz referentnih članaka ne smiju biti runtime pozadine ni gotovi dijelovi sučelja.
Glavna dvorana, Radionica i Strojarnica trenutačno su izvedene izvornim DOM/CSS slojevima u
`src/components/scenes/DiegeticScenes.tsx` i ne zahtijevaju rasterske pozadine.

Ako se kasnije dodaju originalno izrađeni rasteri ili 3D renderi, organiziraju se po prostoriji:

- `background/` — daleki okoliš bez interaktivnih elemenata
- `midground/` — arhitektura i prostorni okvir
- `foreground/` — bliski dekorativni slojevi
- `objects/` — fizičke kontrole s odvojenim stanjima
- `effects/` — svjetlo, čestice i podatkovni tokovi

Ponovno upotrebljivi artefakti pripadaju u zasebnu zbirku: ključevi, kapsule, trezori,
prekidači, blokovi i njihova vizualna stanja. Svaki interaktivni artefakt mora imati dostupnu
semantičku kontrolu u DOM-u i ne smije ovisiti o položaju nacrtanom unutar jedne pozadinske slike.

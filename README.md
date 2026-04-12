# 4D Embedding Space Visualizer

Three.js ile hazirlanmis, sahte hidden-state verisi kullanan bir embedding visualizer prototipi.

## Icerik

- `index.html`: Arayuz ve panel yerlesimi
- `styles.css`: Stil katmani
- `app.js`: Sahte veri uretimi, PCA, ball-tree tabanli esik baglantilari ve Three.js sahnesi

## Calistirma

```powershell
cd d:\ProcessOne\proof_of_concept\world
python -m http.server 4173
```

Ardindan tarayicida `http://localhost:4173` adresini acin.

## Gercek veri exportu

`hidden_states.json` dosyasini uretmek icin:

```powershell
cd d:\ProcessOne\proof_of_concept\world
python extract_hidden_states.py
```

Hizli kontrol icin agir model yuklemeden:

```powershell
python extract_hidden_states.py --dry-run
```

Not: Yerel `qwen2.5-7b-awq` konfigi 28 decoder layer icerdigi icin istenen `layer 32`
otomatik olarak son gecerli katmana clamp edilir. Export metadata'sinda bu not tutulur.

## Ozellikler

- X / Y / Z eksenlerinde PCA'nin ilk 3 bileseni
- W ekseni icin `0-32` katman slider'i
- Katmanlar arasi animasyonlu gecis
- Kategori bazli renklendirme
- Ball tree destekli yaricap taramasi ile threshold baglantilari
- Token hover bilgisinde token metni, katman ve aktif SVD bilesenleri
- OrbitControls ile rotate / zoom / pan

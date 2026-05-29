# Ícones — feito ✓

Os 3 PNGs (16, 48, 128) já estão nesta pasta. Gerados a partir de
`/public/images/boldfy-icon.svg` usando ImageMagick.

Pra regerar (ex: depois de update no SVG):

```bash
cd boldfy-extension/public
SVG="../../public/images/boldfy-icon.svg"
convert -background none -density 600 -resize 16x16 "$SVG" icon-16.png
convert -background none -density 600 -resize 48x48 "$SVG" icon-48.png
convert -background none -density 600 -resize 128x128 "$SVG" icon-128.png
```

Pode apagar esse arquivo a qualquer momento — só serve de doc.

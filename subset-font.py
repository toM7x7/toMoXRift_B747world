# Regenerate public/NotoSansJP-Subset.woff from the Noto Sans JP variable font.
# Usage:
#   curl -sL -o NotoSansJP-var.ttf "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
#   python subset-font.py
# Requires: pip install fonttools
import glob
import io

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

chars = set()
for path in glob.glob('src/**/*.ts*', recursive=True):
    with io.open(path, encoding='utf-8') as f:
        chars.update(f.read())
chars.update(chr(c) for c in range(0x20, 0x7F))
chars.update('、。・「」『』（）！？：；〜ーぁ-んァ-ヶ％℃㎡×÷±→←↑↓◯◎△□☆★♪…')
text = ''.join(sorted(c for c in chars if ord(c) >= 0x20))
print('unique chars:', len(text))

font = TTFont('NotoSansJP-var.ttf')
instantiateVariableFont(font, {'wght': 400}, inplace=True)

opts = Options()
opts.flavor = 'woff'
opts.desubroutinize = True
subsetter = Subsetter(options=opts)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = 'woff'
font.save('public/NotoSansJP-Subset.woff')
print('saved public/NotoSansJP-Subset.woff')

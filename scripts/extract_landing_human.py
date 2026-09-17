"""Deterministic alpha mask of the approved journey figure. No synthesis or RGB edits.

Contour coordinates are traced on a 4x inspection crop of source rectangle
(700, 585, 830, 930). Supersampling antialiases only the alpha boundary.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/assets/machine-city-journey.png'
destination = ROOT / 'public/assets/landing-human-original.png'
crop = Image.open(source).convert('RGB').crop((700, 585, 830, 930))
outline = [
 (268,44),(288,48),(312,59),(326,77),(334,97),(331,120),
 (327,134),(332,140),(330,160),(325,170),(315,172),(307,202),
 (320,211),(333,215),(342,229),(358,238),(365,257),(396,272),
 (416,282),(426,299),(438,336),(446,373),(454,419),(461,464),
 (462,486),(468,506),(470,537),(469,568),(474,597),(474,628),
 (464,643),(463,670),(458,678),(462,706),(459,728),(448,744),
 (429,755),(410,759),(412,745),(422,733),(428,713),(425,701),
 (419,706),(415,724),(407,725),(409,699),(417,676),(413,654),
 (405,644),(402,630),(396,622),(396,646),(399,679),(399,727),
 (396,777),(393,825),(388,875),(390,910),(382,936),(392,970),
 (394,1021),(389,1070),(389,1104),(397,1130),(400,1145),
 (388,1177),(389,1188),(411,1197),(426,1214),(431,1250),
 (428,1266),(410,1277),(368,1292),(330,1298),(316,1284),
 (317,1245),(313,1208),(310,1187),(304,1165),(304,1134),
 (300,1091),(302,1030),(304,983),(304,962),(295,936),
 (294,910),(284,852),(274,800),(267,760),(262,760),
 (253,803),(243,848),(234,886),(229,909),(222,936),
 (221,968),(216,1012),(214,1071),(207,1106),(205,1130),
 (217,1149),(215,1168),(207,1189),(202,1214),(199,1260),
 (203,1282),(198,1294),(169,1295),(134,1285),(110,1270),
 (103,1251),(103,1229),(111,1210),(126,1194),(135,1190),
 (136,1174),(129,1157),(127,1136),(135,1106),(130,1069),
 (129,1025),(131,982),(137,950),(138,928),(135,914),
 (137,889),(138,870),(135,821),(135,774),(135,750),
 (124,752),(105,743),(90,731),(85,716),(84,683),
 (83,673),(77,672),(74,652),(74,641),(66,629),(65,607),
 (64,580),(65,551),(63,523),(65,488),(68,466),(69,432),
 (73,399),(80,365),(89,328),(99,296),(110,281),
 (132,269),(161,258),(165,242),(177,230),(196,225),
 (207,208),(229,205),(225,179),(220,172),(210,167),
 (205,154),(205,140),(211,132),(208,112),(207,92),
 (214,75),(226,62),(244,54)
]
holes = [
 [(142,508),(136,512),(134,548),(129,571),(127,593),(125,616),
  (125,632),(120,642),(121,660),(131,681),(129,698),(122,694),
  (118,700),(124,724),(130,732),(133,747),(135,747),(135,717),
  (139,690),(139,664),(135,639),(136,612),(144,564)],
 [(387,488),(392,490),(392,505),(385,505)],
 [(389,520),(395,524),(396,536),(389,535)],
 [(394,555),(398,576),(405,605),(410,626),(402,637),(399,655),
  (397,647),(392,622),(391,584)]
]
mask = Image.new('L', (520, 1380), 0)
draw = ImageDraw.Draw(mask)
draw.polygon(outline, fill=255)
for hole in holes: draw.polygon(hole, fill=0)
mask = mask.resize(crop.size, Image.Resampling.LANCZOS)
result = crop.convert('RGBA')
result.putalpha(mask)
result.save(destination)
# Every RGB pixel is copied from the original, including partially transparent edges.
assert result.convert('RGB').tobytes() == crop.tobytes()
assert mask.getpixel((0,0)) == 0
assert mask.getpixel((65,100)) == 255
report = {
 'asset': 'public/assets/landing-human-original.png',
 'source': 'public/assets/machine-city-journey.png',
 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
 'crop': [700,585,830,930], 'size': list(result.size),
 'method': 'Manually traced, supersampled alpha mask; no generation, RGB modification or rescaling of source pixels.',
 'verification': 'All output RGB pixels equal the corresponding source crop exactly. Only alpha was added.',
 'assetSha256': hashlib.sha256(destination.read_bytes()).hexdigest()
}
(ROOT/'assets/textures/landing-human-original.provenance.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))

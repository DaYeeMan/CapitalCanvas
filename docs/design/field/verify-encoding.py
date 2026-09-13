"""Independent decoded-frame checks; requires NumPy, Pillow and FIELD_FFMPEG."""
import json, os, subprocess
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[3]
media = root / 'apps/web/public/media/field'
out = Path(__file__).parent / 'asset-checks'
process = subprocess.Popen([os.environ['FIELD_FFMPEG'], '-v', 'error', '-i', str(media / 'field-loop.mp4'), '-vf', 'scale=320:180', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], stdout=subprocess.PIPE)
frames = []
while True:
    raw = process.stdout.read(320*180*3)
    if not raw: break
    assert len(raw) == 320*180*3
    frames.append(np.frombuffer(raw, dtype=np.uint8).astype(float).reshape(180,320,3))
assert process.wait() == 0 and len(frames) == 240
delta = lambda a,b: float(np.abs(a-b).mean())
seam = delta(frames[-1],frames[0])
adjacent = [delta(a,b) for a,b in zip(frames,frames[1:])]
assert seam < max(adjacent)*1.5
assert delta(frames[0],frames[120]) > seam*5
poster = np.asarray(Image.open(media/'field-poster.webp').convert('RGB').resize((320,180)), dtype=float)
def lum(rgb):
    c=rgb/255
    return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4) @ np.array([.2126,.7152,.0722])
contrast={}
for overlay in [.4,.5,.6,.68,.72]:
    max_lum=max(float(lum(f*(1-overlay)+np.array([3,16,29])*overlay).max()) for f in frames)
    contrast[str(overlay)]=float((lum(np.array([168.,180.,189.]))+.05)/(max_lum+.05))
result={'frameCount':len(frames),'fps':24,'codec':'H.264 / yuv420p / no audio','seamMeanRgbDelta':seam,'maxAdjacentMeanRgbDelta':max(adjacent),'meanAdjacentRgbDelta':float(np.mean(adjacent)),'halfCycleMeanRgbDelta':delta(frames[0],frames[120]),'posterFirstFrameMeanRgbDelta':delta(poster,frames[0]),'minimumMutedTextContrastByNavyOverlay':contrast}
(out/'encoding-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))

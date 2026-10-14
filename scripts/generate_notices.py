from pathlib import Path
import json,struct
root=Path(__file__).resolve().parents[1]
modules=root/'apps/web/node_modules'
entries=[]
packages={}
def add_package(name, parent=modules, recursive=True):
 # Resolve nested dependencies before the root installation, like Node does.
 candidates=[parent/name]+[ancestor/'node_modules'/name for ancestor in parent.parents]
 p=next((candidate for candidate in candidates if (candidate/'package.json').is_file()),None)
 if p is None:raise ValueError('Missing installed dependency: '+name)
 meta=json.loads((p/'package.json').read_text(encoding='utf-8'))
 key=(meta['name'],meta['version'])
 if key in packages:return
 packages[key]=(p,meta)
 if recursive:
  for dependency in meta.get('dependencies',{}):add_package(dependency,p/'node_modules')
for name in ['react','react-dom','scheduler','lucide-react','plotly.js-dist-min','katex']:
 p=modules/name;meta=json.loads((p/'package.json').read_text(encoding='utf-8'));packages[(name,meta['version'])]=(p,meta)
for name in ['three','@react-three/fiber','three-stdlib','maath']:add_package(name)
# The preview uses the orthographic camera helper, not optional FaceControls or StatsGl.
# Revisit their notices before importing those features and their dependencies.
add_package('@react-three/drei',recursive=False)
for (name,version),(p,meta) in packages.items():
 files=[f for f in p.glob('*') if f.is_file() and f.name.upper().startswith(('LICENSE','LICENCE','COPYING'))]
 if not files:
  source=root/'docs/licenses'/f"{name.replace('@','').replace('/','-')}-{version}.txt"
  if source.is_file():files=[source]
 if not files:raise ValueError('Missing license: '+name)
 entries.append({'name':name,'version':version,'text':'\n\n'.join(f.read_text(encoding='utf-8') for f in files)})
entries.append({'name':'Plotly bundled components','version':'2.35.3','text':(root/'docs/licenses/plotly-2.35.3-bundled.txt').read_text(encoding='utf-8')})
font_notices=[]
for p in sorted((modules/'katex/dist/fonts').glob('*.ttf')):
 data=p.read_bytes();n=struct.unpack_from('>H',data,4)[0];notices=set()
 for i in range(n):
  tag,_,off,_=struct.unpack_from('>4sIII',data,12+i*16)
  if tag!=b'name':continue
  _,count,start=struct.unpack_from('>HHH',data,off)
  for j in range(count):
   platform,_,_,nid,length,pos=struct.unpack_from('>HHHHHH',data,off+6+j*12)
   if nid in (0,13,14):notices.add(data[off+start+pos:off+start+pos+length].decode('utf-16-be' if platform in (0,3) else 'latin1'))
 if not notices:raise ValueError('Missing font notice: '+str(p))
 font_notices.append(p.name+'\n'+'\n'.join(sorted(notices)))
entries.append({'name':'KaTeX mathematical fonts','version':'0.16.22','text':'\n\n'.join(font_notices)+'\n\n'+(root/'docs/licenses/OFL-1.1.txt').read_text(encoding='utf-8')})
entries.append({'name':'Office characters by Quaternius','version':'CC0 1.0 / CC BY 3.0','text':(root/'apps/web/public/office/people/CREDITS.md').read_text(encoding='utf-8')+'\n\n'+(root/'docs/licenses/CC0-1.0.txt').read_text(encoding='utf-8')+'\n\n'+(root/'docs/licenses/CC-BY-3.0.txt').read_text(encoding='utf-8')})
(root/'apps/web/src/site/notices.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Generated',len(entries),'license entries')

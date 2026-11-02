"""Lossless source import. Run: python scripts/import_figma.py [directory with 1/2/3.json]."""
import json, hashlib, re, sys, shutil, math
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'reference'
def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n.get('children', []))
def color(p):
    c=p.get('color',{}); return 'rgba(%s,%s,%s,%s)' % (*[round(c.get(k,0)*255) for k in ('r','g','b')], c.get('a',1)*p.get('opacity',1))
def visible(ps): return [p for p in ps if p.get('visible',True)]
def rounded_polygon(data,radius):
    # Figma stores vector cornerRadius separately from its unrounded M/L paths.
    if radius<=0 or not data.rstrip().endswith('Z') or re.search(r'[CQASTHV]',data):return data
    pairs=re.findall(r'[ML]\s+([-+\d.eE]+)\s+([-+\d.eE]+)',data)
    pts=[tuple(map(float,p)) for p in pairs]
    if len(pts)>1 and pts[-1]==pts[0]:pts.pop()
    if len(pts)<3:return data
    corners=[]
    for i,p in enumerate(pts):
        prev,nxt=pts[i-1],pts[(i+1)%len(pts)];a=(prev[0]-p[0],prev[1]-p[1]);b=(nxt[0]-p[0],nxt[1]-p[1]);la,lb=math.hypot(*a),math.hypot(*b)
        ua,ub=(a[0]/la,a[1]/la),(b[0]/lb,b[1]/lb);angle=math.acos(max(-1,min(1,ua[0]*ub[0]+ua[1]*ub[1])))
        distance=min(radius/math.tan(angle/2),la/2,lb/2);r=distance*math.tan(angle/2)
        entry=(p[0]+ua[0]*distance,p[1]+ua[1]*distance);end=(p[0]+ub[0]*distance,p[1]+ub[1]*distance)
        sweep=1 if a[0]*b[1]-a[1]*b[0]<0 else 0;corners.append((entry,end,r,sweep))
    parts=[]
    for i,(a,b,r,sweep) in enumerate(corners):parts.append(f'{"M" if i==0 else "L"} {a[0]} {a[1]} A {r} {r} 0 0 {sweep} {b[0]} {b[1]}')
    return ' '.join(parts)+' Z'
def matrix(n):
    m=n.get('relativeTransform',[[1,0,n.get('x',0)],[0,1,n.get('y',0)]])
    return f'matrix({m[0][0]} {m[1][0]} {m[0][1]} {m[1][1]} {m[0][2]} {m[1][2]})'
def svg_body(n, root=False):
    if n.get('visible') is False and not root:return ''
    # This exporter records GROUP descendants in their containing frame's coordinate system.
    if n['type']=='GROUP': return ''.join(svg_body(c) for c in n.get('children',[]))
    fills=visible(n.get('fills',[])); strokes=visible(n.get('strokes',[]))
    attrs=f' fill="{color(fills[0]) if fills else "none"}" stroke="{color(strokes[0]) if strokes else "none"}" stroke-width="{n.get("strokeWeight",1)}" stroke-linecap="round" stroke-linejoin="round"'
    if n['type']=='VECTOR':
        body=''.join(f'<path d="{escape(rounded_polygon(p["data"],n.get("cornerRadius",0)),quote=True)}" fill-rule="{"evenodd" if p["windingRule"]=="EVENODD" else "nonzero"}"{attrs}/>' for p in n.get('vectorPaths',[]))
    else:
        body=''
        if fills or strokes:
            body=f'<rect width="{n["width"]}" height="{n["height"]}" rx="{n.get("cornerRadius",0)}"{attrs}/>'
        body+=''.join(svg_body(c) for c in n.get('children',[]))
    return f'<g opacity="{n.get("opacity",1)}"'+('' if root else f' transform="{matrix(n)}"')+'>'+body+'</g>'

docs=[]
for i in (1,2,3):
    p=SOURCE/f'{i}.json'; d=json.loads(p.read_text(encoding='utf-8'));docs.append(d)
    target=ROOT/'reference'/p.name
    if p.resolve()!=target.resolve():shutil.copy2(p,target)
allnodes={n['id']:n for d in docs for n in walk(d['nodes']+d.get('dependencies',[]))}
assets={}; manifest=[]; files={}
for n in allnodes.values():
    desc=list(walk([n]))
    named_icon=':' in n['name'] and n['type']=='FRAME'
    composite=(n['type'] in ('FRAME','INSTANCE','COMPONENT') and any(c['type']=='VECTOR' for c in desc) and (named_icon or not any(c['type']=='TEXT' for c in desc)))
    if n['type']!='VECTOR' and not composite:continue
    w,h=n['width'],n['height']
    # Zero-sized line bounds need a nonzero viewBox. Padding preserves their exact stroke extent.
    pad=max(n.get('strokeWeight',0),1) if n['type']=='VECTOR' else 0
    source=n
    if named_icon:source={**n,'children':[c for c in n.get('children',[]) if not any(v['type']=='TEXT' for v in walk([c]))]}
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w+2*pad}" height="{h+2*pad}" viewBox="{-pad} {-pad} {w+2*pad} {h+2*pad}">'+svg_body(source,True)+'</svg>'
    digest=hashlib.sha256(svg.encode()).hexdigest()[:12]
    label=re.sub('[^a-z0-9]+','-',n['name'].lower()).strip('-') or 'vector'
    path=files.setdefault(digest,f'assets/icons/{label[:50]}-{digest}.svg')
    (ROOT/path).write_text(svg,encoding='utf-8')
    assets[n['id']]={'src':path,'pad':pad}
    manifest.append({'nodeId':n['id'],'name':n['name'],'file':path,'width':w,'height':h,'padding':pad,'composite':bool(composite)})

keep={'id','name','type','x','y','width','height','visible','opacity','relativeTransform','layoutMode','layoutSizingHorizontal','layoutSizingVertical','layoutPositioning','primaryAxisAlignItems','counterAxisAlignItems','paddingTop','paddingRight','paddingBottom','paddingLeft','itemSpacing','cornerRadius','topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','clipsContent','fills','strokes','strokeWeight','strokeAlign','effects','characters','fontName','fontSize','lineHeight','letterSpacing','textAlignHorizontal','textAlignVertical','segments','mainComponentId','variantProperties','componentPropertyDefinitions','componentProperties','description'}
def clean(n):
    r={k:v for k,v in n.items() if k in keep}
    if n['id'] in assets:r['asset']=assets[n['id']]
    if n.get('children'):r['children']=[clean(c) for c in n['children']]
    return r
data={'screens':[clean(d['nodes'][0]) for d in docs[:2]],'components':{n['id']:clean(n) for n in allnodes.values() if n['type']=='COMPONENT'},'sets':[{'id':n['id'],'name':n['name'],'variants':[c['id'] for c in n.get('children',[])]} for n in allnodes.values() if n['type']=='COMPONENT_SET']}
data['assets']={n['id']:{**assets[n['id']],'width':n['width'],'height':n['height'],'name':n['name']} for n in allnodes.values() if n['id'] in assets}
(ROOT/'src/design-data.js').write_text('window.FIGMA = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'docs/asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
audit={'screenNodes':[len(list(walk(d['nodes']))) for d in docs[:2]],'componentCount':len(data['components']),'componentSets':len(data['sets']),'svgFiles':len(files),'svgMappings':len(manifest),'missingVectorPaths':[n['id'] for n in allnodes.values() if n['type']=='VECTOR' and not n.get('vectorPaths')],'imageHashes':list({f['imageHash'] for n in allnodes.values() for f in n.get('fills',[]) if f['type']=='IMAGE'}),'fonts':list({n['fontName']['family'] for n in allnodes.values() if n['type']=='TEXT'})}
icons_dir=(ROOT/'assets/icons').resolve()
current={Path(p).name for p in files.values()}
for obsolete in icons_dir.glob('*.svg'):
    if obsolete.name not in current and re.search(r'-[a-f0-9]{12}\.svg$',obsolete.name):
        if obsolete.resolve().parent!=icons_dir:raise RuntimeError('Unsafe asset path')
        obsolete.unlink()
(ROOT/'docs/source-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(audit,ensure_ascii=False))

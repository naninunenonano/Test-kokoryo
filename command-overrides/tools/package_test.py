"""Package a validated offline TEST artifact, all sources/packs/images, with JST ZIP times."""
import argparse
import hashlib
import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import zipfile

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--site',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
site=args.site.resolve()
metadata=json.loads((site/'test-build.json').read_text())
if metadata.get('onlineEnabled') is not False or 'source-split' not in metadata.get('features',[]):
    raise SystemExit('Only an isolated split TEST build may be packaged')
if args.output.exists():
    raise SystemExit('Refusing to overwrite an existing ZIP')
for relative,digest in metadata['files'].items():
    if hashlib.sha256((site/relative).read_bytes()).hexdigest()!=digest:
        raise SystemExit('TEST artifact hash mismatch: '+relative)
version=metadata['version']
now=datetime.now(ZoneInfo('Asia/Tokyo'))
timestamp=now.replace(second=(now.second//2)*2).timetuple()[:6]
entries={str(p.relative_to(site)):p for p in site.rglob('*') if p.is_file()}
for folder in ['tools','docs','tests']:
    for p in (root/folder).rglob('*'):
        if p.is_file() and '__pycache__' not in p.parts:
            entries[str(p.relative_to(root))]=p
for name in ['README.md','package.json','package-lock.json']:
    entries[name]=root/name
assert all(name in entries for name in ['index.html','js/app.js','packs/pack1.js','packs/pack2.js','packs/rules_pack1.js'])
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for relative,p in sorted(entries.items()):
        info=zipfile.ZipInfo(version+'/'+relative,date_time=timestamp)
        info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        archive.writestr(info,p.read_bytes())
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert all(i.filename.startswith(version+'/') and i.date_time==timestamp for i in archive.infolist())
    for relative,p in entries.items():
        assert archive.read(version+'/'+relative)==p.read_bytes()
print(json.dumps({'zip':str(args.output.resolve()),'version':version,'files':len(entries),'bytes':args.output.stat().st_size,
                  'jst_timestamp':str(datetime(*timestamp))+' JST','pack_js':sorted(x for x in entries if x.startswith('packs/') and x.endswith('.js'))},ensure_ascii=False),flush=True)

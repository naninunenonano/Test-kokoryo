#!/usr/bin/env python3
"""Build an offline-only Pages artifact from an immutable, same-repository PR head."""
import argparse
import hashlib
import html as html_lib
import io
import json
import os
import re
import shutil
import tarfile
import tempfile
import urllib.request
from pathlib import Path
import sys
import subprocess
sys.path.insert(0, str(Path(__file__).resolve().parent))
from clock_patch import inject_clock

SOURCE_REPO = 'naninunenonano/kokoryo'
TARGET_REPO = 'naninunenonano/Test-kokoryo'


def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'kokoryo-test-builder', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def resolve_pr(number):
    data = json.loads(get(f'https://api.github.com/repos/{SOURCE_REPO}/pulls/{number}'))
    if data['head']['repo']['full_name'] != SOURCE_REPO:
        raise ValueError('Only PR heads from the original repository are supported.')
    commit = data['head']['sha']
    if not re.fullmatch(r'[0-9a-f]{40}', commit):
        raise ValueError('Invalid PR commit')
    return commit


def unpack_source(commit, target):
    archive = get(f'https://codeload.github.com/{SOURCE_REPO}/tar.gz/{commit}')
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
        for member in tar:
            parts = Path(member.name).parts[1:]
            if not parts or '..' in parts or Path(*parts).is_absolute():
                continue
            if not member.isfile() or member.issym() or member.islnk():
                continue
            if parts[0] not in ('images', 'packs', 'tests', 'src', 'js', 'tools', 'docs') and parts not in [('index.html',), ('package.json',), ('package-lock.json',), ('README.md',)]:
                continue
            destination = target.joinpath(*parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(tar.extractfile(member).read())


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f'Upstream structure changed; refusing unsafe preview: {old[:90]}')
    return source.replace(old, new, 1)


def patch_html(source, pr, commit, source_split=False):
    match = re.search(r'オリジナル版 Ver\.(\d+\.\d+\.\d+)', source)
    if not match:
        raise ValueError('Missing source version')
    source_version = match[1]
    parts = source_version.split('.')
    version = source_version if source_split else '.'.join(parts[:-1] + [str(int(parts[-1]) + 2)])
    preview_commit = os.environ.get('GITHUB_SHA', 'local')
    clock_match = re.search(r'const TURN_CLOCK_INITIAL=(\d+),TURN_CLOCK_INCREMENT=(\d+);', source)
    initial_ms, increment_ms = map(int, clock_match.groups()) if clock_match else (180000, 30000)
    build = {'environment': 'offline-test', 'version': version, 'sourceVersion': source_version,
             'pr': pr, 'commit': commit, 'previewCommit': preview_commit, 'onlineEnabled': False,
             'features': ['turn-chess-clock'], 'clock': {'initialSeconds': initial_ms // 1000, 'maxSeconds': initial_ms // 1000, 'incrementSeconds': increment_ms // 1000, 'timeoutDieConversion': 'normal'}}
    if source_split:
        build['features'].append('source-split')
        if 'once:commandOnce' in source:
            build['features'].append('generic-commands-phase2')
        if 'discount:commandDiscount' in source:
            build['features'].append('generic-effects-224')
        if 'const INITIAL_DRAFT=' in source:
            build['features'].append('initial-settings-225')
    if 'const BALANCED_INSTALL_COSTS=' in source:
        build['features'].append('standard1-balance-226')
    source = source.replace(source_version, version)
    source = once(source, '<html lang="ja"><head>', '<html lang="ja"><head>' +
        '<meta http-equiv="Content-Security-Policy" content="default-src &#39;self&#39;; script-src &#39;self&#39; &#39;unsafe-inline&#39; &#39;unsafe-eval&#39;; style-src &#39;self&#39; &#39;unsafe-inline&#39;; img-src &#39;self&#39; data:; connect-src &#39;none&#39;; object-src &#39;none&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">')
    source = once(source, '<title>ここから先は、僕の領地</title>', f'<title>TEST Ver.{version}｜ここ領 PR #{pr}</title>')
    source = once(source, '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '<!-- Offline test: the Supabase SDK is intentionally not loaded. -->')
    source = once(source, '<script>\n(()=>{', '<script>\n(()=>{\nconst KOKORYO_OFFLINE_TEST=true;\nconst TEST_BUILD=Object.freeze(' + json.dumps(build) + ');')
    source, count = re.subn(r"const SUPABASE_URL='[^']*';", "const SUPABASE_URL='';", source)
    if count != 1:
        raise ValueError('Supabase URL declaration changed')
    source, count = re.subn(r"const SUPABASE_PUBLISHABLE_KEY='[^']*';", "const SUPABASE_PUBLISHABLE_KEY='';", source)
    if count != 1:
        raise ValueError('Supabase key declaration changed')
    source = once(source, 'function ensureSupabaseClient(){', "function ensureSupabaseClient(){\n if(KOKORYO_OFFLINE_TEST)throw new Error('テスト版はオフライン・Bot戦専用です。');")
    source = once(source, 'async function enterRealOnlineLobby(name,pass,resume=null){', "async function enterRealOnlineLobby(name,pass,resume=null){\n if(KOKORYO_OFFLINE_TEST){const err=q('#entryError');if(err)err.textContent='テスト版ではオンライン接続できません。';return false;}")
    source = once(source, 'async function handleEntryJoin(){', "async function handleEntryJoin(){\n if(KOKORYO_OFFLINE_TEST){q('#entryError').textContent='下のオフラインプレイまたはBot戦を選択してください。';return;}")
    source = once(source, 'function loadRealOnlineResume(){', 'function loadRealOnlineResume(){if(KOKORYO_OFFLINE_TEST)return null;')
    source = once(source, "setTimeout(()=>{const r=loadRealOnlineResume();", "setTimeout(()=>{if(KOKORYO_OFFLINE_TEST)return;const r=loadRealOnlineResume();")
    deck_storage_key = 'kokoryo_custom_decks_v2' if "'kokoryo_custom_decks_v2'" in source else 'kokoryo_custom_decks_v1'
    for key in [deck_storage_key, 'kokoryo_online_resume_v36', 'kokoryo_online_client_v36']:
        source = once(source, "'" + key + "'", "'" + key.replace('kokoryo_', 'kokoryo_test_', 1) + "'")
    source = source.replace("'kokoryo-room-v3:'", "'kokoryo-test-room-v3:'").replace("'kokoryo-lobby-'", "'kokoryo-test-lobby-'")
    # Preserve the original online functions and all Bot rules. Only replace the test entry UI.
    begin = source.index('<div id="entryScreen"')
    end = source.index('<div id="onlineRealLobby"', begin)
    source = source[:begin] + '''<div id="entryScreen" class="entry-screen"><div class="entry-card">
<h1>ここ領 テスト版</h1><p>オフライン・Bot戦専用</p>
<button id="testOfflineStart" class="primary" type="button">オフラインプレイ</button>
<button id="testBotStart" class="primary" type="button">Bot戦</button>
<div id="entryError" class="entry-error"></div><input id="entryName" type="hidden"><input id="entryPass" type="hidden"><button id="entryJoin" type="button" hidden>オンライン接続無効</button>
</div></div>''' + source[end:]
    banner = f'''<aside id="testBanner" role="status"><strong>TEST Ver.{version}</strong> <span title="基準Ver.{source_version} / source {commit}">PR #{pr} · build <code title="{preview_commit}">{preview_commit[:12]}</code> · 持ち時間制／オフライン・Bot専用</span> <button id="testHome" type="button">テスト入口へ</button></aside>'''
    style = '''<style>#testBanner{position:fixed;inset:0 0 auto 0;z-index:30000;background:#fff1b8;color:#302700;border-bottom:2px solid #a87500;padding:7px 9px;font:12px/1.5 system-ui;box-sizing:border-box}#testBanner strong{font-size:14px}#testBanner button{font-size:11px;padding:2px 5px;background:white;border:1px solid #997000;border-radius:5px}#gameover.endgame-progress{z-index:30001;top:calc(var(--test-banner-bottom,65px) + 8px);max-width:calc(100vw - 24px);box-sizing:border-box;max-height:calc(100dvh - var(--test-banner-bottom,65px) - 24px);overflow:auto}body{padding-top:65px!important}.online-draft-screen,.online-resource-screen{padding-top:65px!important}.online-char-screen,.online-debug-lobby{padding-top:10px}.entry-screen{min-height:calc(100dvh - 100px)}@media(max-width:500px){#testBanner span{font-size:10px}}</style>'''
    source = once(source, '</head><body>', style + '</head><body>' + banner)
    entry_handlers = '''
// TEST header must not cover the existing final-round notification.
function updateTestEndgameNoticeOffset(){
 const banner=q('#testBanner');if(!banner)return;
 const bottom=banner.getBoundingClientRect().bottom||65;
 document.documentElement.style.setProperty('--test-banner-bottom',bottom+'px');
}
updateTestEndgameNoticeOffset();
window.addEventListener('resize',updateTestEndgameNoticeOffset);
if(typeof ResizeObserver==='function')new ResizeObserver(updateTestEndgameNoticeOffset).observe(q('#testBanner'));
// Test-only entry points reuse the shipped local and Bot implementations.
q('#testOfflineStart').onclick=()=>{
 botMatchMode=false;realOnlineMainMode=false;onlineDebugMode=false;
 enterLocalDebugMode();q('#setup').classList.remove('hidden');
 q('#status').textContent='オフラインテスト：全プレイヤーをこの端末で操作できます。';
};
q('#testBotStart').onclick=()=>enterBotMatch();
q('#testHome').onclick=()=>location.reload();
'''
    source = once(source, '\n})();\nconst q=s=>document.querySelector(s);', entry_handlers + '\n})();\nconst q=s=>document.querySelector(s);')
    source = inject_clock(source, once)
    return source, build


def inline_split_source(source_dir, source):
    tags = re.findall(r'<script src="js/app\.js(?:\?v=[0-9.]+)?"></script>', source)
    if len(tags) != 1:
        if (source_dir / 'src/order.json').exists():
            raise ValueError('Unknown split entry point; refusing an inline fallback')
        return source, False
    manifest = json.loads((source_dir / 'src/order.json').read_text())
    if manifest.get('schema') != 1:
        raise ValueError('Unknown split manifest schema')
    sections = {}
    for name in set(x['file'] for x in manifest['sections']):
        if not re.fullmatch(r'[a-z_]+\.js', name):
            raise ValueError('Unsafe split source path')
        text = (source_dir / 'src' / name).read_text()
        pattern = r'^// @kokoryo-section (S\d+)\n([\s\S]*?)\n// @kokoryo-end-section \1(?:\n|$)'
        for m in re.finditer(pattern, text, re.M):
            if m[1] in sections:
                raise ValueError('Duplicate split section')
            sections[m[1]] = (name, m[2])
        outside = re.sub(pattern, '', text, flags=re.M)
        outside = re.sub(r'//[^\n]*|/\*[\s\S]*?\*/', '', outside)
        if outside.strip():
            raise ValueError('Unordered split source code')
    code, closed, used = manifest['prefix'], False, set()
    for entry in manifest['sections']:
        if entry['id'] in used or sections.get(entry['id'], (None,))[0] != entry['file']:
            raise ValueError('Missing or moved split section')
        if entry.get('epilogue'):
            if closed:
                raise ValueError('Duplicate split epilogue')
            code += manifest['close']
            closed = True
        code += sections[entry['id']][1]
        used.add(entry['id'])
    if not closed or len(used) != len(sections) or code != (source_dir / 'js/app.js').read_text():
        raise ValueError('Stale split bundle; run npm run build in the source PR')
    return once(source, tags[0], '<script>' + code + '</script>'), True


def externalize_split_preview(source, output):
    matches = list(re.finditer(r'<script>([\s\S]*?)</script>', source))
    if len(matches) != 1:
        raise ValueError('Expected one patched app script')
    m = matches[0]
    (output / 'js/app.js').write_text(m[1])
    version = re.search(r'TEST Ver\.(\d+\.\d+\.\d+)', source)[1]
    return once(source, m[0], '<script src="js/app.js?v=' + version + '"></script>')


def build(source_dir, output, pr, commit):
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be empty; refusing to overwrite another build')
    output.mkdir(parents=True, exist_ok=True)
    for folder in ['packs', 'images']:
        if not (source_dir / folder).is_dir():
            raise ValueError(f'Missing source folder: {folder}')
        shutil.copytree(source_dir / folder, output / folder, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.*'))
    for script in ['pack1.js', 'pack2.js', 'rules_pack1.js']:
        if not (output / 'packs' / script).is_file():
            raise ValueError('Missing required pack: ' + script)
    for folder in ['src', 'js']:
        if (source_dir / folder).is_dir():
            shutil.copytree(source_dir / folder, output / folder, dirs_exist_ok=True)
    source, source_split = inline_split_source(source_dir, (source_dir / 'index.html').read_text())
    patched, metadata = patch_html(source, pr, commit, source_split)
    if source_split:
        patched = externalize_split_preview(patched, output)
    (output / 'index.html').write_text(patched)
    (output / '.nojekyll').write_text('')
    manifest = {str(p.relative_to(output)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.rglob('*')) if p.is_file()}
    metadata['files'] = manifest
    (output / 'test-build.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
    print(json.dumps({k:v for k,v in metadata.items() if k != 'files'}, ensure_ascii=False))
    print(f'Copied {len(manifest)} files; original online code retained but connection disabled.')


def apply_command_overrides(directory, overrides, commit):
    if commit != '1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a':
        raise ValueError('Cumulative overrides require the pinned Ver.0.3.221 baseline')
    allowed = {'docs/VER241_REPORT.md','tests/ui241.cjs','tests/online241.cjs','tests/scope241.cjs','tests/fixtures/ui241.cjs','tests/fixtures/scope241.json','docs/VER240_REPORT.md', 'tests/selection240.cjs', 'tests/fixtures/selection240.cjs', 'tests/fixtures/scope240.json', 'docs/VER239_REPORT.md', 'tests/characters239.cjs', 'tests/fixtures/characters239.cjs', 'tests/fixtures/scope239.json', 'docs/VER238_REPORT.md', 'tests/normal238.cjs', 'tests/fixtures/normal238.cjs', 'tests/fixtures/scope238.json', 'tests/standard237.cjs', 'tests/fixtures/catalog236.json', 'tests/fixtures/standard236.json', 'tests/fixtures/standard237.cjs', 'docs/VER237_REPORT.md', 'tests/selection236.cjs', 'tests/fixtures/selection235.json', 'tests/fixtures/selection236.cjs', 'tests/stock234.cjs', 'tests/scope233.cjs', 'docs/VER233_REPORT.md', 'tests/notice233.cjs', 'tests/ui232.cjs', 'tests/usability232.cjs', 'tests/scope232.cjs', 'tests/fixtures/scope231.json', 'docs/VER232_REPORT.md', 'tests/bot231.cjs', 'tests/hire231.cjs', 'tests/scope231.cjs', 'tests/fixtures/scope230.json', 'docs/VER231_REPORT.md', 'docs/VER227_REPORT.md', 'tests/overclock230.cjs', 'tests/regression.cjs', 'docs/VER230_REPORT.md', 'src/characters.js', 'packs/pack1.js', 'src/bootstrap.js', 'src/bot.js', 'tests/fixtures/scope_225.json', 'index.html', 'docs/dependencies.json', 'docs/DEPENDENCIES.md', 'package-lock.json', 'package.json', 'tools/package_test.py', 'tests/scope230.cjs', 'src/online.js', 'docs/COMMANDS.md', 'tests/fixtures/normal_222.json', 'tests/start227.cjs', 'src/debug.js', 'src/card_effects.js', 'tests/normal_commands.cjs', 'packs/rules_pack1.js', 'tests/integration224.cjs', 'tests/fixtures/scope229.json', 'tests/setup225.cjs', 'src/game.js', 'tests/equivalent_vp229.cjs', 'tests/equivalent_gain229.cjs', 'docs/VER226_REPORT.md', 'docs/VER224_REPORT.md', 'tests/fixtures/scope228.json', 'tests/fixtures/scope_223.json', 'docs/VER229_REPORT.md', 'tests/equivalent229.cjs', 'tests/fixtures/standard_221.json', 'docs/VER225_REPORT.md', 'tests/split.cjs', 'tests/commands.cjs', 'tests/startup.cjs', 'packs/pack2.js', 'README.md', 'src/order.json', 'tests/balance226.cjs', 'tools/build.cjs', 'tests/clock.cjs', 'src/ui.js', 'docs/VER228_REPORT.md', 'tests/scope225.cjs', 'tests/fixtures/legends_223.json', 'tests/fixtures/scope_224.json', 'src/decks.js', 'tests/oracle230.cjs', 'tests/scope229.cjs', 'tests/online.cjs'}
    files = {str(p.relative_to(overrides)): p for p in overrides.rglob('*') if p.is_file() and not set(p.relative_to(overrides).parts) & {'node_modules','js','images','__pycache__'}}
    if set(files) != allowed:
        raise ValueError('Unexpected or missing TEST cumulative override files')
    for relative, source in files.items():
        if source.is_symlink():
            raise ValueError('Override symlinks are forbidden')
        destination = directory / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    subprocess.run(['npm', 'ci', '--ignore-scripts'], cwd=directory, check=True)
    for command in ['build']:
        subprocess.run(['npm', 'run', command], cwd=directory, check=True)
    subprocess.run(['npm', 'test'], cwd=directory, check=True)


def build_test_owned(source, output, pr, commit):
    """Build exclusively TEST-owned sources; asset bytes are hash-pinned TEST images."""
    import concurrent.futures
    assets=json.loads((Path(__file__).parent/'test-assets-228.json').read_text())
    def asset(item):
        name, digest=item
        target=source/name
        if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==digest:
            return
        data=get('https://naninunenonano.github.io/Test-kokoryo/'+name)
        if hashlib.sha256(data).hexdigest()!=digest:
            raise ValueError('TEST asset hash mismatch: '+name)
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        list(executor.map(asset,assets.items()))
    subprocess.run(['npm','ci','--ignore-scripts'],cwd=source,check=True)
    subprocess.run(['npm','run','build'],cwd=source,check=True)
    subprocess.run(['npm','test'],cwd=source,check=True)
    build(source, output, pr, commit)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pr', type=int, required=True)
    parser.add_argument('--commit', help='Optional expected PR commit; abort when head changed')
    parser.add_argument('--source-dir', type=Path, help='Local immutable source snapshot, for tests')
    parser.add_argument('--command-overrides', type=Path, help='TEST-owned phase-one source changes')
    parser.add_argument('--test-owned', type=Path, help='Self-contained TEST sources; never read production')
    parser.add_argument('--output', type=Path, default=Path('_site'))
    args = parser.parse_args()
    if args.pr < 1:
        parser.error('PR must be a positive number')
    if args.test_owned:
        if not args.commit or not re.fullmatch('[0-9a-f]{40}',args.commit):
            parser.error('TEST-owned build requires explicit source provenance')
        build_test_owned(args.test_owned,args.output,args.pr,args.commit)
    elif args.source_dir:
        if not args.commit or not re.fullmatch('[0-9a-f]{40}', args.commit):
            parser.error('Local builds require an explicit commit SHA')
        if args.command_overrides:
            parser.error('Overrides require a fresh immutable download')
        build(args.source_dir, args.output, args.pr, args.commit)
    else:
        commit = resolve_pr(args.pr)
        if args.commit and args.commit != commit:
            raise ValueError('PR head changed; refusing a different source commit')
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            unpack_source(commit, directory)
            if args.command_overrides:
                apply_command_overrides(directory, args.command_overrides, commit)
            build(directory, args.output, args.pr, commit)


if __name__ == '__main__':
    main()

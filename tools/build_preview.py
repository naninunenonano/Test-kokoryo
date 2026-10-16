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
            if parts[0] not in ('images', 'packs', 'tests') and parts != ('index.html',):
                continue
            destination = target.joinpath(*parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(tar.extractfile(member).read())


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError(f'Upstream structure changed; refusing unsafe preview: {old[:90]}')
    return source.replace(old, new, 1)


def patch_html(source, pr, commit):
    match = re.search(r'オリジナル版 Ver\.(\d+\.\d+\.\d+)', source)
    if not match:
        raise ValueError('Missing source version')
    source_version = match[1]
    parts = source_version.split('.')
    version = '.'.join(parts[:-1] + [str(int(parts[-1]) + 2)])
    preview_commit = os.environ.get('GITHUB_SHA', 'local')
    build = {'environment': 'offline-test', 'version': version, 'sourceVersion': source_version,
             'pr': pr, 'commit': commit, 'previewCommit': preview_commit, 'onlineEnabled': False,
             'features': ['turn-chess-clock'], 'clock': {'initialSeconds': 180, 'maxSeconds': 180, 'incrementSeconds': 30, 'timeoutDieConversion': 'normal'}}
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
    for key in ['kokoryo_custom_decks_v1', 'kokoryo_online_resume_v36', 'kokoryo_online_client_v36']:
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
    style = '''<style>#testBanner{position:fixed;inset:0 0 auto 0;z-index:30000;background:#fff1b8;color:#302700;border-bottom:2px solid #a87500;padding:7px 9px;font:12px/1.5 system-ui;box-sizing:border-box}#testBanner strong{font-size:14px}#testBanner button{font-size:11px;padding:2px 5px;background:white;border:1px solid #997000;border-radius:5px}body{padding-top:65px!important}.online-draft-screen,.online-resource-screen{padding-top:65px!important}.online-char-screen,.online-debug-lobby{padding-top:10px}.entry-screen{min-height:calc(100dvh - 100px)}@media(max-width:500px){#testBanner span{font-size:10px}}</style>'''
    source = once(source, '</head><body>', style + '</head><body>' + banner)
    entry_handlers = '''
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


def build(source_dir, output, pr, commit):
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be empty; refusing to overwrite another build')
    output.mkdir(parents=True, exist_ok=True)
    for folder in ['packs', 'images']:
        if not (source_dir / folder).is_dir():
            raise ValueError(f'Missing source folder: {folder}')
        shutil.copytree(source_dir / folder, output / folder, dirs_exist_ok=True)
    for script in ['pack1.js', 'pack2.js', 'rules_pack1.js']:
        if not (output / 'packs' / script).is_file():
            raise ValueError('Missing required pack: ' + script)
    source = (source_dir / 'index.html').read_text()
    patched, metadata = patch_html(source, pr, commit)
    (output / 'index.html').write_text(patched)
    (output / '.nojekyll').write_text('')
    manifest = {str(p.relative_to(output)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(output.rglob('*')) if p.is_file()}
    metadata['files'] = manifest
    (output / 'test-build.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False))
    print(json.dumps({k:v for k,v in metadata.items() if k != 'files'}, ensure_ascii=False))
    print(f'Copied {len(manifest)} files; original online code retained but connection disabled.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pr', type=int, required=True)
    parser.add_argument('--commit', help='Optional expected PR commit; abort when head changed')
    parser.add_argument('--source-dir', type=Path, help='Local immutable source snapshot, for tests')
    parser.add_argument('--output', type=Path, default=Path('_site'))
    args = parser.parse_args()
    if args.pr < 1:
        parser.error('PR must be a positive number')
    if args.source_dir:
        if not args.commit or not re.fullmatch('[0-9a-f]{40}', args.commit):
            parser.error('Local builds require an explicit commit SHA')
        build(args.source_dir, args.output, args.pr, args.commit)
    else:
        commit = resolve_pr(args.pr)
        if args.commit and args.commit != commit:
            raise ValueError('PR head changed; refusing a different source commit')
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            unpack_source(commit, directory)
            build(directory, args.output, args.pr, commit)


if __name__ == '__main__':
    main()

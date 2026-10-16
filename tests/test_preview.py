import hashlib
import importlib.util
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'tools/build_preview.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
SITE = ROOT / '_site'


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []
        self.csp = None
        self.ids = []

    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if tag in ('script', 'img') and a.get('src'):
            self.sources.append(a['src'])
        if tag == 'meta' and a.get('http-equiv') == 'Content-Security-Policy':
            self.csp = a['content']
        if a.get('id'):
            self.ids.append(a['id'])


class PreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (SITE / 'index.html').read_text()
        cls.metadata = json.loads((SITE / 'test-build.json').read_text())
        cls.dom = Assets()
        cls.dom.feed(cls.html)

    def test_visible_build_identity(self):
        m = self.metadata
        self.assertIn('TEST Ver.' + m['version'], self.html)
        self.assertIn('PR #' + str(m['pr']), self.html)
        self.assertIn(m['commit'][:12], self.html)
        self.assertRegex(m['commit'], r'^[0-9a-f]{40}$')
        self.assertFalse(m['onlineEnabled'])

    def test_network_is_fail_closed_without_configuration(self):
        self.assertIn("connect-src 'none'", self.dom.csp)
        self.assertIn("const SUPABASE_URL='';", self.html)
        self.assertIn("const SUPABASE_PUBLISHABLE_KEY='';", self.html)
        self.assertIn('function ensureSupabaseClient(){\n if(KOKORYO_OFFLINE_TEST)throw', self.html)
        self.assertIn('async function enterRealOnlineLobby(name,pass,resume=null){\n if(KOKORYO_OFFLINE_TEST)', self.html)
        self.assertNotRegex(self.html, r'https://[\w-]+\.supabase\.co')
        self.assertNotIn('sb_publishable_', self.html)

    def test_no_external_sdk_or_script(self):
        for url in self.dom.sources:
            self.assertNotRegex(url, r'^(https?:)?//')
        self.assertNotIn('cdn.jsdelivr.net', self.html)

    def test_production_storage_keys_are_not_read_or_written(self):
        for key in ['kokoryo_custom_decks_v1', 'kokoryo_online_resume_v36', 'kokoryo_online_client_v36']:
            self.assertNotIn("'" + key + "'", self.html)
            self.assertIn("'" + key.replace('kokoryo_', 'kokoryo_test_', 1) + "'", self.html)
        self.assertNotIn('localStorage.clear(', self.html)

    def test_autoresume_is_disabled(self):
        self.assertIn('function loadRealOnlineResume(){if(KOKORYO_OFFLINE_TEST)return null;', self.html)
        self.assertIn('setTimeout(()=>{if(KOKORYO_OFFLINE_TEST)return;const r=loadRealOnlineResume();', self.html)

    def test_clock_feature_identity_and_fail_closed_hooks(self):
        self.assertIn('turn-chess-clock', self.metadata['features'])
        self.assertEqual(self.metadata['clock'], {'initialSeconds': 180, 'maxSeconds': 180, 'incrementSeconds': 30, 'timeoutDieResources': 3})
        self.assertIn('sourceVersion', self.metadata)
        self.assertIn('previewCommit', self.metadata)
        self.assertIn('function testClockOriginalCompleteEnd(){', self.html)
        self.assertIn('function completeEnd(){', self.html)
        self.assertIn("gainResource(turn,col,1+bonus,'dieConvert')", self.html)
        self.assertIn('testClockBotValid(actor,clockBotToken)', self.html)

    def test_local_and_bot_modes_reuse_existing_handlers(self):
        self.assertEqual(self.dom.ids.count('testOfflineStart'), 1)
        self.assertEqual(self.dom.ids.count('testBotStart'), 1)
        self.assertIn("q('#testBotStart').onclick=()=>enterBotMatch();", self.html)
        self.assertIn('enterLocalDebugMode();', self.html)
        self.assertIn('function botExecuteTurn(', self.html.replace('async function', 'function'))
        self.assertIn('function start(){', self.html)

    def test_online_code_remains(self):
        for function in ['enterRealOnlineLobby', 'ensureSupabaseClient', 'applyRealMainSnapshot', 'broadcastRealMainState']:
            self.assertIn('function ' + function + '(', self.html)
        self.assertIn('client.channel(topic', self.html)

    def test_pack_scripts_and_image_hashes(self):
        for file, digest in self.metadata['files'].items():
            p = SITE / file
            self.assertTrue(p.is_file(), file)
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), digest, file)
        for file in ['packs/pack1.js', 'packs/pack2.js', 'packs/rules_pack1.js']:
            self.assertIn(file, self.metadata['files'])
        self.assertGreater(len(list((SITE / 'images').rglob('*.png'))), 0)
        for source in self.dom.sources:
            self.assertTrue((SITE / source).is_file(), source)

    def test_generated_only_assets_not_workflows_or_tests(self):
        self.assertFalse((SITE / '.github').exists())
        self.assertFalse((SITE / 'tests').exists())
        self.assertTrue((SITE / '.nojekyll').exists())

    def test_upstream_structure_changes_abort_build(self):
        for token in ['function ensureSupabaseClient(){', 'function loadRealOnlineResume(){', 'async function enterRealOnlineLobby(name,pass,resume=null){']:
            for changed in ['changed-upstream', token + token]:
                with self.assertRaises(ValueError):
                    builder.once(changed, token, 'patched')

    def test_workflow_is_test_repository_only(self):
        flow = (ROOT / '.github/workflows/preview.yml').read_text()
        self.assertIn("github.repository == 'naninunenonano/Test-kokoryo'", flow)
        self.assertIn('workflow_dispatch:', flow)
        self.assertNotIn('pull_request_target:', flow)
        self.assertNotIn('contents: write', flow)
        self.assertNotIn('git push', flow)


if __name__ == '__main__':
    unittest.main()

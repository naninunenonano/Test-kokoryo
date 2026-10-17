import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('command_builder',ROOT/'tools/build_preview.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
BASE='1ca6ccfcf7c5f9cddea8c508f472b0af04a9167a'
class CommandBuildTests(unittest.TestCase):
 def test_requires_pinned_baseline(self):
  with self.assertRaisesRegex(ValueError,'pinned'):
   builder.apply_command_overrides(Path('/unused'),ROOT/'command-overrides','0'*40)
 def test_rejects_incomplete_changes(self):
  with tempfile.TemporaryDirectory() as tmp:
   with self.assertRaisesRegex(ValueError,'Unexpected or missing'):
    builder.apply_command_overrides(Path(tmp),Path(tmp),BASE)
 def test_overrides_then_builds_and_runs_full_suite(self):
  with tempfile.TemporaryDirectory() as tmp,patch.object(builder.subprocess,'run') as run:
   builder.apply_command_overrides(Path(tmp),ROOT/'command-overrides',BASE)
   self.assertIn('const cardCommands=',(Path(tmp)/'src/game.js').read_text())
   self.assertFalse((Path(tmp)/'src/order.json').exists())
   self.assertEqual([c.args[0] for c in run.call_args_list],[['npm','ci','--ignore-scripts'],['npm','run','build'],['npm','run','analyze'],['npm','test']])
 def test_pull_request_validation_cannot_deploy(self):
  workflow=(ROOT/'.github/workflows/preview.yml').read_text()
  self.assertIn('  pull_request:\n    branches: [main]',workflow)
  self.assertIn("  deploy:\n    if: github.event_name != 'pull_request'",workflow)
  self.assertIn("      - name: Configure test Pages\n        if: github.event_name != 'pull_request'",workflow)
  self.assertIn("      - uses: actions/upload-pages-artifact@v4\n        if: github.event_name != 'pull_request'",workflow)

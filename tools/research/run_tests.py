"""Run research engine tests:  python -I -B tools/research/run_tests.py"""
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # python -I does not add this folder

suite = unittest.defaultTestLoader.discover(str(HERE / 'tests'), top_level_dir=str(HERE))
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)

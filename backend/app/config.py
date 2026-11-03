"""Environment configuration and artifact paths. No credentials are logged."""
import os
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_ROOT = Path(os.getenv('SECURITY_ARTIFACT_ROOT', str(PROJECT_ROOT))).resolve()
env_path = Path(os.getenv('SECURITY_ENV_FILE', str(PROJECT_ROOT / '.env')))
load_dotenv(env_path, override=False, encoding='utf-8-sig')
MODEL_PATH = ARTIFACT_ROOT / 'ml' / 'models' / 'random_forest.pkl'
MAPPING_PATH = ARTIFACT_ROOT / 'ml' / 'data' / 'processed' / 'label_mapping.json'
FEATURE_FILE = ARTIFACT_ROOT / 'ml' / 'data' / 'processed' / 'split' / 'X_train.csv'
X_TEST_PATH = ARTIFACT_ROOT / 'ml' / 'data' / 'processed' / 'split' / 'X_test.csv'
Y_TEST_PATH = ARTIFACT_ROOT / 'ml' / 'data' / 'processed' / 'split' / 'y_test.csv'
EVALUATION_REPORT_PATH = ARTIFACT_ROOT / 'ml' / 'data' / 'processed' / 'evaluation_report.json'
BATCH_SIZE = 20000

API_VERSION = "1.4.0"

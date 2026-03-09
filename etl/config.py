"""GovInsight ETL 設定"""
from urllib.parse import quote

# ---- RSシステム -------------------------------------------------------
RS_BASE_URL = "https://rssystem.go.jp/files/{year}/rs"

# 取得対象年度
RS_TARGET_YEARS = [2024, 2025]

# 取得ファイル: (ID, カテゴリ名_日本語)
# URL = {RS_BASE_URL}/{ID}_RS_{year}_{カテゴリ名}.zip （日本語はURLエンコード）
RS_FILES = [
    ("1-1", "基本情報_組織情報"),
    ("1-2", "基本情報_事業概要等"),
    ("2-1", "予算・執行_サマリ"),
    ("4-1", "点検・評価"),
    ("5-1", "支出先_支出情報"),
]

def rs_file_url(year: int, file_id: str, name_ja: str) -> str:
    filename = f"{file_id}_RS_{year}_{name_ja}.zip"
    return f"{RS_BASE_URL.format(year=year)}/{quote(filename)}"

# デジタル庁フィルタ
DIGITAL_AGENCY_NAME = "デジタル庁"

# ---- 政府調達ポータル -------------------------------------------------------
PROCUREMENT_API_URL = "https://api.p-portal.go.jp/pps-web-biz/UAB03/OAB0301"
PROCUREMENT_TARGET_YEARS = [2024, 2025]

def procurement_file_url(year: int) -> str:
    filename = f"successful_bid_record_info_all_{year}.zip"
    return f"{PROCUREMENT_API_URL}?fileversion=v001&filename={filename}"

# デジタル庁の府省コード
DIGITAL_AGENCY_CODE = "W1"

# ---- 出力 -------------------------------------------------------
OUTPUT_DIR = "../public/data"
# corrections.jsonはリポジトリ内に置く（etl/ディレクトリ相対）
CORRECTIONS_FILE = "corrections.json"

# ---- マッチング -------------------------------------------------------
# 令和X年度プレフィックス除去後の TF-IDF コサイン類似度閾値
# 0.25: 精度・再現率バランス最適（0.20以下は誤マッチ増加、0.30以上は見逃し増加）
MATCHING_THRESHOLD = 0.25

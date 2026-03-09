"""
政府調達ポータル 落札実績 CSV ダウンロード
api.p-portal.go.jp から年度別全件ZIPを取得する。
"""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

import requests

from config import PROCUREMENT_TARGET_YEARS, procurement_file_url

TIMEOUT = 120
HEADERS = {"User-Agent": "GovInsight-ETL/1.0 (https://govinsight.jp)"}


def download_procurement_year(year: int, output_dir: Path) -> Path | None:
    """指定年度の落札実績CSVをダウンロード・解凍して返す。"""
    year_dir = output_dir / f"p-portal_{year}"
    year_dir.mkdir(parents=True, exist_ok=True)

    url = procurement_file_url(year)
    print(f"[Procurement] {year}年度 GET {url}")

    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  [ERROR] ダウンロード失敗: {e}")
        return None

    try:
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            csv_names = [n for n in z.namelist() if n.endswith(".csv")]
            if not csv_names:
                print(f"  [ERROR] ZIP内にCSVが見つからない")
                return None
            csv_name = csv_names[0]
            z.extract(csv_name, year_dir)
            csv_path = year_dir / csv_name
            print(f"  → {csv_path} ({csv_path.stat().st_size / 1024 / 1024:.1f}MB)")
            return csv_path
    except zipfile.BadZipFile as e:
        print(f"  [ERROR] ZIPファイル破損: {e}")
        return None


def fetch_all(data_dir: Path) -> dict[int, Path]:
    """全年度の調達データを取得。{年度: CSVパス} を返す。"""
    results: dict[int, Path] = {}
    for year in PROCUREMENT_TARGET_YEARS:
        path = download_procurement_year(year, data_dir)
        if path:
            results[year] = path
    return results


if __name__ == "__main__":
    import sys
    data_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("../../60_data")
    fetch_all(data_dir)

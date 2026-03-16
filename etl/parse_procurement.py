"""
政府調達ポータル 落札実績 CSV パーサー
CSV仕様: UTF-8 BOM付き、ヘッダー行なし、8列
"""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

from config import DIGITAL_AGENCY_CODE

# RS事業と無関係な調達案件を除外するパターン（施設管理・消耗品・庁内管理・研修・調査研究・機器賃貸借・採用）
_NON_RS_PATTERNS = re.compile(
    # 施設・設備
    r"ビル設備機器|照明.*変更作業|空気調和装置|庁舎警備業務|レイアウト変更|産業廃棄物"
    r"|個別空気調和装置|執務室.*照明変更"
    # 消耗品・什器
    r"|什器|文房具|コピー用紙|トナー.*消耗品|ＵＳＢメモリ"
    # 庁内管理
    r"|健康診断|翻訳業務|速記業務|自動車運行管理|廃棄物の収集|清掃業務"
    r"|社会保険.*雇用保険.*業務委託|タクシーチケット.*電子化|タクシーアプリ.*導入"
    # 職員向け研修・教育（情報セキュリティ研修含む全研修）
    r"|職員.*コンプライアンス研修|コンプライアンス研修.*企画.*実施"
    r"|プライバシー.*バイ.*デザイン.*推進.*研修|研修室照明変更"
    r"|情報セキュリティ.*研修|セキュリティ技術.*コース"
    r"|生成AI研修|AIリテラシー学習コンテンツ"
    # 複合機・プリンタ機器賃貸借（GSS移行含む）
    r"|複合機.*賃貸借|プリンタ.*賃貸借"
    # 採用支援
    r"|民間専門人材採用.*支援|障害者採用.*支援|デジタル人材採用.*支援"
    r"|人材採用.*サイトリニューアル"
    # 調査研究・実証研究・アンケート（RS事業と直接紐付かないポリシー調査・社会調査）
    r"|調査研究|調査業務|調査・実証|実証調査研究|定点調査|アンケート調査"
    # 研修コンテンツ・e-ラーニング
    r"|研修コンテンツ|e-ラーニング|eラーニング|eLearning"
)

# CSV列定義（ヘッダーなし → 番号で指定）
COLUMNS = [
    "procurement_id",   # 調達案件番号（19桁）
    "name",             # 調達案件名称
    "award_date",       # 落札決定日（YYYY-MM-DD）
    "price",            # 落札価格
    "ministry_code",    # 府省コード
    "bid_method_code",  # 入札方式コード
    "vendor_name",      # 商号又は名称
    "corporate_number", # 法人番号
]

BID_METHOD_MAP = {
    "8002010": "一般競争入札・最低価格",
    "8002040": "一般競争入札・総合評価",
    "8004030": "随意契約・公募型プロポーザル",
    "8004020": "随意契約・特定業者",
    "8004010": "随意契約・少額",
    "8003010": "指名競争入札",
}


def parse_procurement(csv_path: Path, ministry_filter: str | None = DIGITAL_AGENCY_CODE) -> pd.DataFrame:
    """落札実績CSVを読み込んでDataFrameを返す。

    Args:
        csv_path: successful_bid_record_info_all_{year}.csv
        ministry_filter: None なら全府省庁。デフォルトは 'W1'（デジタル庁）

    Returns:
        DataFrame with columns: procurement_id, name, award_date, price,
        ministry_code, bid_method_code, bid_method_name, vendor_name,
        corporate_number, fiscal_year
    """
    df = pd.read_csv(
        csv_path,
        encoding="utf-8-sig",
        header=None,
        names=COLUMNS,
        dtype=str,
    )

    if ministry_filter:
        df = df[df["ministry_code"] == ministry_filter].copy()

    # RS事業と無関係な案件を除外（施設管理・消耗品・庁内管理）
    df = df[~df["name"].fillna("").str.contains(_NON_RS_PATTERNS)].copy()

    if df.empty:
        return df

    # 型変換
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["award_date"] = pd.to_datetime(df["award_date"], errors="coerce").dt.strftime("%Y-%m-%d")

    # 入札方式名称を追加
    df["bid_method_name"] = df["bid_method_code"].map(BID_METHOD_MAP).fillna(df["bid_method_code"])

    # 年度を award_date から推定（4月始まり）
    df["fiscal_year"] = _to_fiscal_year(df["award_date"])

    # 文字列クリーニング
    for col in ["name", "vendor_name", "corporate_number"]:
        df[col] = df[col].fillna("").str.strip()

    return df.reset_index(drop=True)


def _to_fiscal_year(award_date_series: pd.Series) -> pd.Series:
    """落札日から日本の年度（4月始まり）を計算。"""
    dt = pd.to_datetime(award_date_series, errors="coerce")
    return dt.apply(lambda d: d.year if (pd.notna(d) and d.month >= 4) else (d.year - 1 if pd.notna(d) else None))

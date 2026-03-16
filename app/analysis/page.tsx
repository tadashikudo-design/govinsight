"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VendorAnalysis } from "@/lib/types";

const CLOUD_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  AWS:            { bar: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  "Google Cloud": { bar: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  Azure:          { bar: "bg-cyan-500",   text: "text-cyan-700",   bg: "bg-cyan-50" },
  "Oracle Cloud": { bar: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50" },
  Salesforce:     { bar: "bg-sky-400",    text: "text-sky-700",    bg: "bg-sky-50" },
  SAP:            { bar: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "国内大手SI":          "bg-blue-500",
  "外資コンサル":        "bg-purple-500",
  "国内通信":            "bg-green-500",
  "国内コンサル・ベンダー": "bg-teal-500",
  "外資クラウド":        "bg-orange-400",
  "その他":              "bg-gray-400",
};

// RS 5-1 支出先データからクラウド別の事業IDを静的マッピング
// （vendor_analysis.json では事業リストが含まれないため、projects/{id}.json から集約した情報）
const CLOUD_PROJECT_MAP: Record<string, { id: string; name: string }[]> = {
  AWS: [
    { id: "5543", name: "ガバメントクラウド" },
    { id: "5544", name: "公共サービスメッシュ（デジタル連携基盤）" },
    { id: "6549", name: "情報提供ネットワークシステム" },
    { id: "6550", name: "第二期政府共通プラットフォーム" },
    { id: "7634", name: "標準型電子カルテα版" },
  ],
  "Google Cloud": [
    { id: "5543", name: "ガバメントクラウド" },
    { id: "6570", name: "総合運用・監視システム（COSMOS）" },
  ],
  Azure: [
    { id: "13",   name: "共通情報検索システム" },
    { id: "5543", name: "ガバメントクラウド" },
  ],
  "Oracle Cloud": [
    { id: "5543", name: "ガバメントクラウド" },
  ],
  Salesforce: [
    { id: "27", name: "補助金申請システム" },
  ],
};

function formatAmount(yen: number | null): string {
  if (yen == null) return "—";
  if (yen >= 1e8) return `${(yen / 1e8).toFixed(1)}億円`;
  if (yen >= 1e4) return `${Math.round(yen / 1e4)}万円`;
  return `${yen.toLocaleString()}円`;
}

function RiskBadge({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-gray-400 text-xs">—</span>;
  const risk = rate >= 60 ? "高" : rate >= 30 ? "中" : "低";
  const cls = rate >= 60
    ? "bg-red-100 text-red-700"
    : rate >= 30
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {risk} {rate.toFixed(0)}%
    </span>
  );
}

function HHILabel({ hhi }: { hhi: number | null }) {
  if (hhi == null) return <span className="text-gray-400">—</span>;
  const level = hhi >= 2500 ? { label: "高集中", cls: "text-red-600" }
    : hhi >= 1500 ? { label: "中程度", cls: "text-yellow-600" }
    : { label: "競争的", cls: "text-green-600" };
  return (
    <span className={`font-bold ${level.cls}`}>
      {hhi.toLocaleString()} <span className="text-sm font-normal">({level.label})</span>
    </span>
  );
}

export default function AnalysisPage() {
  const [data, setData] = useState<VendorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"cloud" | "category" | "vendors" | "procurement">("cloud");
  const [cloudMetric, setCloudMetric] = useState<"amount" | "count">("count");
  const [expandedCloud, setExpandedCloud] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/vendor_analysis.json")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">分析データを読み込み中…</div>;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <strong>vendor_analysis.json が見つかりません。</strong><br />
        ETLを実行してデータを生成してください。
      </div>
    );
  }

  const cm = data.concentrationMetrics;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ベンダー依存分析</h1>
        <p className="mt-1 text-sm text-gray-500">
          RS 5-1 支出情報をもとにした特定サービス・企業への依存度分析
          ／ 最終更新: {new Date(data.updatedAt).toLocaleDateString("ja-JP")}
        </p>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="商業ベンダー数" value={`${cm.vendorCount}社`} />
        <KpiCard label="クラウド支出比率" value={`${data.cloudShare?.toFixed(1) ?? "—"}%`}
          sub={formatAmount(data.totalCloudSpend)} />
        <KpiCard label="TOP3 集中度" value={`${cm.top3Share?.toFixed(1) ?? "—"}%`}
          sub="上位3社シェア" />
        <KpiCard label="HHI指数" value={cm.hhi?.toLocaleString() ?? "—"}
          sub={cm.hhi != null ? (cm.hhi >= 2500 ? "高集中" : cm.hhi >= 1500 ? "中程度" : "競争的") : "—"}
          highlight={cm.hhi != null && cm.hhi >= 1500} />
      </div>

      {/* 集中度バー */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">市場集中度</h2>
        <div className="space-y-3">
          {[
            { label: "TOP3社", value: cm.top3Share },
            { label: "TOP5社", value: cm.top5Share },
            { label: "TOP10社", value: cm.top10Share },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-gray-500">{label}</span>
              <div className="flex-1 rounded-full bg-gray-100 h-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gov-light-blue transition-all"
                  style={{ width: `${value ?? 0}%` }}
                />
              </div>
              <span className="w-14 text-right text-xs font-mono text-gray-700">
                {value?.toFixed(1) ?? "—"}%
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          HHI {cm.hhi?.toLocaleString() ?? "—"} ／ 2500以上=高集中、1500以上=中程度、1500未満=競争的市場
        </p>
      </section>

      {/* タブ切り替え */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["cloud", "category", "vendors", "procurement"] as const).map((tab) => {
          const labels = { cloud: "☁️ クラウド依存", category: "📊 カテゴリ別", vendors: "🏢 支出先TOP30", procurement: "📋 調達ベンダー" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-gov-blue text-gov-blue"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ☁️ クラウドタブ */}
      {activeTab === "cloud" && (
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* ヘッダー + メトリクス切り替え */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800">クラウドプラットフォーム依存度</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  RS 5-1 支出先データ（デジタル庁が直接契約しているクラウドのみ）
                </p>
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setCloudMetric("count")}
                  className={`px-3 py-1.5 transition-colors ${cloudMetric === "count" ? "bg-gov-blue text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  件数ベース
                </button>
                <button
                  onClick={() => setCloudMetric("amount")}
                  className={`px-3 py-1.5 transition-colors ${cloudMetric === "amount" ? "bg-gov-blue text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  金額ベース
                </button>
              </div>
            </div>

            {/* サマリー行 */}
            <div className="mb-4 flex gap-4 text-xs text-gray-500">
              <span>対象事業数: <strong className="text-gray-800">{data.cloudPlatforms.reduce((s, p) => s + p.projectCount, 0)}件</strong></span>
              <span>クラウド総支出: <strong className="text-gray-800">{formatAmount(data.totalCloudSpend)}</strong></span>
              <span>RS支出全体比: <strong className="text-gray-800">{data.cloudShare?.toFixed(1)}%</strong></span>
            </div>

            {/* クラウドプラットフォーム棒グラフ */}
            <div className="space-y-4">
              {data.cloudPlatforms.map((p) => {
                const color = CLOUD_COLORS[p.platform] ?? { bar: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-50" };
                const shareValue = cloudMetric === "count" ? (p.countShare ?? 0) : (p.share ?? 0);
                const shareLabel = cloudMetric === "count"
                  ? `${p.projectCount}件 (${p.countShare?.toFixed(1)}%)`
                  : `${formatAmount(p.amount)} (${p.share?.toFixed(1)}%)`;
                const isExpanded = expandedCloud === p.platform;
                const projects = CLOUD_PROJECT_MAP[p.platform] ?? [];

                return (
                  <div key={p.platform} className={`rounded-lg border transition-colors ${isExpanded ? "border-gray-300" : "border-transparent"}`}>
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedCloud(isExpanded ? null : p.platform)}
                    >
                      <div className="space-y-1.5 px-3 pt-3 pb-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-3 h-3 rounded-full ${color.bar}`} />
                            <span className="text-sm font-semibold text-gray-800">{p.platform}</span>
                            {/* 件数と金額を両方表示 */}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}>
                              {p.projectCount}事業
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-gray-700">{shareLabel}</span>
                            <span className={`text-xs text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                          </div>
                        </div>
                        {/* バー */}
                        <div className="rounded-full bg-gray-100 h-5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color.bar} opacity-80 transition-all`}
                            style={{ width: `${shareValue}%` }}
                          />
                        </div>
                        {/* 件数/金額サブ表示 */}
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>件数シェア: {p.countShare?.toFixed(1) ?? "—"}%</span>
                          <span>金額シェア: {p.share?.toFixed(1) ?? "—"}%</span>
                          <span>{formatAmount(p.amount)}</span>
                        </div>
                      </div>
                    </button>

                    {/* 展開: 関連事業リスト */}
                    {isExpanded && projects.length > 0 && (
                      <div className={`mx-3 mb-3 rounded-lg ${color.bg} px-3 py-2`}>
                        <p className="mb-1.5 text-xs font-medium text-gray-600">関連事業</p>
                        <div className="flex flex-wrap gap-2">
                          {projects.map((proj) => (
                            <Link
                              key={proj.id}
                              href={`/projects/${proj.id}`}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:opacity-80 ${color.text} border-current`}
                            >
                              {proj.name} →
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {data.cloudPlatforms.length === 0 && (
              <p className="text-sm text-gray-400">クラウドプラットフォームの支出データがありません。</p>
            )}
          </div>

          {/* MS365 注記 */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700">
            <strong>ℹ️ Microsoft 365 (GSS) について:</strong>{" "}
            ガバメントソリューションサービス（GSS）の日本マイクロソフト支出（約41億円）はOffice/Teams等のSaaS利用であり、
            IaaS/PaaSのAzureとは別に集計しています。GSSはSIerを通じた間接調達のため上記には含まれません。
          </div>

          {/* AWS 依存リスク注記 */}
          {(data.cloudPlatforms[0]?.countShare ?? 0) >= 40 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <strong>⚠️ AWS 集中:</strong> 直接契約事業の{data.cloudPlatforms[0]?.countShare?.toFixed(0)}%（件数ベース）がAWSです。
              ただしSIer経由のクラウド利用は非表示のため、実際の依存度はさらに高い可能性があります。
            </div>
          )}
        </section>
      )}

      {/* 📊 カテゴリ別タブ */}
      {activeTab === "category" && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">カテゴリ別支出構成</h2>
          <div className="space-y-3">
            {data.categoryBreakdown.map((c) => (
              <div key={c.category} className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-sm ${CATEGORY_COLORS[c.category] ?? "bg-gray-400"}`} />
                    <span className="text-sm text-gray-800">{c.category}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-700">
                    {formatAmount(c.totalAmount)}
                    <span className="ml-2 text-gray-400">({c.share?.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="rounded-full bg-gray-100 h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[c.category] ?? "bg-gray-400"} opacity-70`}
                    style={{ width: `${c.share ?? 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">{c.projectCount}事業</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            RS 5-1 支出先データを独自分類。「その他」には分類未対応のベンダーを含む。
          </p>
        </section>
      )}

      {/* 🏢 支出先TOP30タブ */}
      {activeTab === "vendors" && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ベンダー名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">カテゴリ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">RS支出額</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">シェア</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">事業数</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">随意契約率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topVendors.map((v, i) => (
                  <tr key={v.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{v.name}</div>
                      {v.cloudPlatform && (
                        <div className="text-xs text-gray-400 mt-0.5">☁️ {v.cloudPlatform}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.category === "国内大手SI" ? "bg-blue-100 text-blue-700" :
                        v.category === "外資コンサル" ? "bg-purple-100 text-purple-700" :
                        v.category === "外資クラウド" ? "bg-orange-100 text-orange-700" :
                        v.category === "国内通信" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {v.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800">
                      {formatAmount(v.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-500">
                      {v.share?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono">{v.projectCount}</td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge rate={v.singleBidRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400">
            随意契約率：RS 5-1 の契約方式等が「随意契約」「一者応札」を含む行の割合。高いほどロックインリスクあり。
          </div>
        </section>
      )}

      {/* 📋 調達ベンダータブ */}
      {activeTab === "procurement" && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 pt-4 pb-2">
            <h2 className="text-base font-semibold text-gray-800">調達ポータル ベンダー統計</h2>
            <p className="text-xs text-gray-500 mt-1">
              デジタル庁 落札データより。ベンダー名をクリックすると落札案件一覧へ移動します。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ベンダー名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">カテゴリ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">落札総額</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">件数</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">競争性なし率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.procurementVendors.map((v) => (
                  <tr key={v.corporateNumber} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/procurements?vendor=${encodeURIComponent(v.name)}`}
                        className="font-medium text-gov-blue hover:underline"
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.category === "国内大手SI" ? "bg-blue-100 text-blue-700" :
                        v.category === "外資コンサル" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {v.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800">
                      {formatAmount(v.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{v.count}</td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge rate={v.noCompetitionRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, highlight = false,
}: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${
      highlight ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
    }`}>
      <p className={`text-xs font-medium ${highlight ? "text-red-500" : "text-gray-500"}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-red-700" : "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

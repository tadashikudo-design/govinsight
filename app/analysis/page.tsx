"use client";

import { useEffect, useState } from "react";
import type { VendorAnalysis } from "@/lib/types";

const CLOUD_COLORS: Record<string, string> = {
  AWS:           "bg-orange-400",
  "Google Cloud": "bg-blue-500",
  Azure:         "bg-cyan-500",
  "Oracle Cloud": "bg-red-500",
  Salesforce:    "bg-sky-400",
  SAP:           "bg-green-500",
};

const CATEGORY_COLORS: Record<string, string> = {
  "国内大手SI":          "bg-blue-500",
  "外資コンサル":        "bg-purple-500",
  "国内通信":            "bg-green-500",
  "国内コンサル・ベンダー": "bg-teal-500",
  "外資クラウド":        "bg-orange-400",
  "その他":              "bg-gray-400",
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
            <h2 className="mb-1 text-base font-semibold text-gray-800">クラウドプラットフォーム依存度</h2>
            <p className="mb-4 text-xs text-gray-500">
              総支出 {formatAmount(data.totalRsSpend)} のうち クラウド {formatAmount(data.totalCloudSpend)}（{data.cloudShare?.toFixed(1)}%）
            </p>

            {/* クラウド比率 棒グラフ */}
            <div className="space-y-3">
              {data.cloudPlatforms.map((p) => (
                <div key={p.platform} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-3 h-3 rounded-full ${CLOUD_COLORS[p.platform] ?? "bg-gray-400"}`} />
                      <span className="text-sm font-medium text-gray-800">{p.platform}</span>
                      {p.platform === "AWS" && (
                        <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-600">
                          最大シェア
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-mono text-gray-700">
                      {formatAmount(p.amount)} <span className="text-gray-400">({p.share?.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="rounded-full bg-gray-100 h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CLOUD_COLORS[p.platform] ?? "bg-gray-400"} opacity-80`}
                      style={{ width: `${p.share ?? 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {p.vendors.slice(0, 3).join("、")}
                  </div>
                </div>
              ))}
            </div>

            {data.cloudPlatforms.length === 0 && (
              <p className="text-sm text-gray-400">クラウドプラットフォームの支出データがありません。</p>
            )}
          </div>

          {/* AWS 依存リスク注記 */}
          {(data.cloudPlatforms[0]?.share ?? 0) >= 80 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              <strong>⚠️ AWS 単一依存リスク:</strong> クラウド支出の{data.cloudPlatforms[0]?.share?.toFixed(0)}%がAWSに集中しています。
              マルチクラウド化やガバメントクラウドの複数採択を検討する必要があります。
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
              デジタル庁 落札データより。競争性のない随意契約・一者応札の割合が高いほどロックインリスク大。
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
                  <tr key={v.corporateNumber} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
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

"use client";

import { useEffect, useState, useMemo } from "react";
import type { VendorRankingItem } from "@/lib/types";

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  外資クラウド:     { label: "外資クラウド",     color: "bg-sky-100 text-sky-700" },
  外資コンサル:     { label: "外資コンサル",     color: "bg-purple-100 text-purple-700" },
  国内大手SI:       { label: "国内大手SI",       color: "bg-blue-100 text-blue-700" },
  国内通信:         { label: "国内通信",         color: "bg-green-100 text-green-700" },
  "国内コンサル・ベンダー": { label: "国内コンサル", color: "bg-teal-100 text-teal-700" },
  その他:           { label: "その他",           color: "bg-gray-100 text-gray-600" },
};

function classifyVendor(name: string): string {
  const n = name.toLowerCase();
  if (["アマゾンウェブサービス","グーグル・クラウド","グーグル合同","日本マイクロソフト","日本オラクル","セールスフォース"].some(p => n.includes(p))) return "外資クラウド";
  if (["アクセンチュア","pwcコンサル","デロイト","kpmg","ibmジャパン","ibm japan"].some(p => n.includes(p))) return "外資コンサル";
  if (["富士通","日本電気","ｎｅｃ","日立","ｎｔｔデータ"].some(p => n.includes(p))) return "国内大手SI";
  if (["ｎｔｔ東日本","ｎｔｔ西日本","ｋｄｄｉ","ｓｂテクノロジー","ソフトバンク"].some(p => n.includes(p))) return "国内通信";
  if (["フューチャーアーキテクト","野村総合研究","電通国際情報","伊藤忠テクノ"].some(p => n.includes(p))) return "国内コンサル・ベンダー";
  return "その他";
}

function formatAmount(yen: number): string {
  if (yen >= 1e8) return `${(yen / 1e8).toFixed(1)}億円`;
  if (yen >= 1e4) return `${Math.round(yen / 1e4)}万円`;
  return `${yen.toLocaleString()}円`;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<(VendorRankingItem & { category: string })[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"totalAmount" | "count">("totalAmount");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/vendors.json")
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items || []).map((v: VendorRankingItem) => ({
          ...v,
          category: classifyVendor(v.name),
        }));
        setVendors(items);
        setLoading(false);
      });
  }, []);

  const totalAmount = useMemo(() => vendors.reduce((s, v) => s + v.totalAmount, 0), [vendors]);

  const filtered = useMemo(() => {
    return vendors
      .filter((v) => {
        const q = search.toLowerCase();
        const matchSearch = !q || v.name.toLowerCase().includes(q);
        const matchCat = categoryFilter === "all" || v.category === categoryFilter;
        return matchSearch && matchCat;
      })
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [vendors, search, categoryFilter, sortKey]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    vendors.forEach((v) => seen.add(v.category));
    return ["all", ...Object.keys(CATEGORY_BADGE).filter((k) => seen.has(k))];
  }, [vendors]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ベンダーランキング</h1>
        <p className="mt-1 text-sm text-gray-500">
          デジタル庁 調達ポータル 落札データ（全年度累計）
        </p>
      </div>

      {/* サマリーカード */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryCard label="ベンダー数" value={`${vendors.length}社`} />
          <SummaryCard label="総調達額" value={formatAmount(totalAmount)} highlight />
          <SummaryCard
            label="表示件数"
            value={`${filtered.length}社`}
          />
        </div>
      )}

      {/* フィルター行 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="ベンダー名で検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-gov-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "all" ? "すべて" : CATEGORY_BADGE[cat]?.label ?? cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortKey("totalAmount")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              sortKey === "totalAmount" ? "bg-gov-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            金額順
          </button>
          <button
            onClick={() => setSortKey("count")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              sortKey === "count" ? "bg-gov-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            件数順
          </button>
        </div>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">読み込み中…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-gray-500">順位</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ベンダー名</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">カテゴリ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">落札総額</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">シェア</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">件数</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">平均単価</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((v, i) => {
                const share = totalAmount > 0 ? (v.totalAmount / totalAmount) * 100 : 0;
                const avg = v.count > 0 ? v.totalAmount / v.count : 0;
                const badge = CATEGORY_BADGE[v.category] ?? CATEGORY_BADGE["その他"];
                return (
                  <tr key={v.corporateNumber ?? v.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{v.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800">
                      {formatAmount(v.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 rounded-full bg-gray-100 h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gov-light-blue rounded-full"
                            style={{ width: `${Math.min(share * 5, 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-500 font-mono">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 font-mono">{v.count}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 font-mono">
                      {formatAmount(avg)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    該当するベンダーはありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${highlight ? "border-gov-blue bg-gov-blue text-white" : "border-gray-200 bg-white"}`}>
      <p className={`text-xs font-medium ${highlight ? "text-blue-100" : "text-gray-500"}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Procurement } from "@/lib/types";

function formatAmount(yen: number): string {
  if (yen >= 1e8) return `${(yen / 1e8).toFixed(1)}億円`;
  if (yen >= 1e4) return `${Math.round(yen / 1e4)}万円`;
  return `${yen.toLocaleString()}円`;
}

function ProcurementsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vendorParam = searchParams.get("vendor") ?? "";

  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState(vendorParam);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/procurements.json")
      .then((r) => r.json())
      .then((d) => {
        setProcurements(d.items ?? []);
        setLoading(false);
      });
  }, []);

  // URL の vendor パラメータが変わったら filter に反映
  useEffect(() => {
    setVendorFilter(vendorParam);
  }, [vendorParam]);

  const filtered = useMemo(() => {
    return [...procurements]
      .filter((p) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q);
        const matchVendor =
          !vendorFilter ||
          p.vendorName.toLowerCase().includes(vendorFilter.toLowerCase());
        return matchSearch && matchVendor;
      })
      .sort((a, b) => b.price - a.price);
  }, [procurements, search, vendorFilter]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, p) => s + p.price, 0),
    [filtered]
  );
  const matched = useMemo(
    () => filtered.filter((p) => p.projectId).length,
    [filtered]
  );

  function clearVendorFilter() {
    setVendorFilter("");
    router.replace("/procurements");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">調達案件一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading
            ? "読み込み中…"
            : `${filtered.length}件 ／ 総額 ${formatAmount(totalAmount)} ／ 事業紐付き ${matched}件 (${
                filtered.length > 0
                  ? ((matched / filtered.length) * 100).toFixed(1)
                  : "0.0"
              }%)`}
        </p>
      </div>

      {/* 検索バー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="案件名・ベンダー名で検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue"
        />
      </div>

      {/* アクティブフィルターバナー */}
      {vendorFilter && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <span className="text-blue-700">
            ベンダー絞り込み中:
            <span className="ml-1 font-semibold">{vendorFilter}</span>
          </span>
          <button
            onClick={clearVendorFilter}
            className="ml-auto rounded px-2 py-0.5 text-xs text-blue-500 hover:bg-blue-100"
          >
            ✕ 解除
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">読み込み中…</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">案件名</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">年度</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">落札日</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">落札企業</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">入札方式</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">落札金額</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">紐付事業</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800 max-w-xs">
                    <span className="line-clamp-2">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {p.fiscalYear ? `${p.fiscalYear}年度` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                    {p.awardDate
                      ? new Date(p.awardDate).toLocaleDateString("ja-JP")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    {p.vendorName ? (
                      <button
                        onClick={() => setVendorFilter(p.vendorName)}
                        className="line-clamp-1 text-left hover:text-gov-blue hover:underline"
                      >
                        {p.vendorName}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BidBadge method={p.bidMethodName} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 whitespace-nowrap">
                    {formatAmount(p.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.projectId ? (
                      <Link
                        href={`/projects/${p.projectId}`}
                        className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-gov-blue hover:underline"
                      >
                        事業詳細
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    該当する調達案件はありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BidBadge({ method }: { method: string }) {
  const isOpen = method?.includes("一般");
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isOpen ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {method || "不明"}
    </span>
  );
}

export default function ProcurementsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-400">読み込み中…</div>}>
      <ProcurementsContent />
    </Suspense>
  );
}

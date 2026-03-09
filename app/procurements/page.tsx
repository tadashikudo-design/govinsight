import { getProcurements, formatAmount } from "@/lib/data";

export default function ProcurementsPage() {
  const procurements = getProcurements();
  const sorted = [...procurements].sort((a, b) => b.price - a.price);

  const totalAmount = procurements.reduce((s, p) => s + p.price, 0);
  const matched = procurements.filter((p) => p.projectId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">調達案件一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          {procurements.length}件 ／ 総額 {formatAmount(totalAmount)} ／
          事業紐付き {matched}件 ({((matched / procurements.length) * 100).toFixed(1)}%)
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                案件名
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">
                年度
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 whitespace-nowrap">
                落札日
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                落札企業
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">
                入札方式
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                落札金額
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">
                紐付事業
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((p) => (
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
                  <span className="line-clamp-1">{p.vendorName || "—"}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <BidBadge method={p.bidMethodName} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900 whitespace-nowrap">
                  {formatAmount(p.price)}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.projectId ? (
                    <a
                      href={`/projects/${p.projectId}`}
                      className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-gov-blue hover:underline"
                    >
                      事業詳細
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BidBadge({ method }: { method: string }) {
  const isOpen = method?.includes("一般");
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isOpen
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {method || "不明"}
    </span>
  );
}

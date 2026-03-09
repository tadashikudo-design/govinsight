import { getProjects, formatAmount, getProcurements } from "@/lib/data";
import type { Procurement } from "@/lib/types";

export default function ProjectsPage() {
  const projects = getProjects();
  const procurements = getProcurements();

  // project別調達集計
  const procByProject = procurements.reduce<
    Record<string, { count: number; amount: number }>
  >((acc, p) => {
    if (!p.projectId) return acc;
    if (!acc[p.projectId]) acc[p.projectId] = { count: 0, amount: 0 };
    acc[p.projectId].count++;
    acc[p.projectId].amount += p.price;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IT事業一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          デジタル庁のIT事業 {projects.length}件
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-8/12">
                事業名
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">
                期間
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                調達件数
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                調達総額
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projects.map((p) => {
              const proc = procByProject[p.id];
              return (
                <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={`/projects/${p.id}`}
                      className="font-medium text-gov-blue hover:underline"
                    >
                      {p.name}
                    </a>
                    {p.overview && (
                      <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                        {p.overview}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                    {p.startYear && p.endYear
                      ? `${p.startYear}〜${p.endYear}`
                      : p.startYear
                        ? `${p.startYear}〜`
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {proc ? `${proc.count}件` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                    {proc ? formatAmount(proc.amount) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

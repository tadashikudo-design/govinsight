import { getProjects, getProjectDetail, formatAmount } from "@/lib/data";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((p) => ({ id: p.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectDetail(id);
  if (!project) notFound();

  const { procurements } = project;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <a
          href="/projects"
          className="text-sm text-gray-500 hover:text-gov-blue"
        >
          ← IT事業一覧
        </a>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {project.name}
        </h1>
        {project.dept && (
          <p className="mt-1 text-sm text-gray-500">{project.dept}</p>
        )}
      </div>

      {/* メタ情報 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetaCard
          label="調達総額"
          value={formatAmount(project.totalAmount)}
          highlight
        />
        <MetaCard label="調達件数" value={`${procurements.length}件`} />
        <MetaCard
          label="落札ベンダー"
          value={`${project.vendorCount}社`}
        />
        <MetaCard
          label="事業期間"
          value={
            project.startYear && project.endYear
              ? `${project.startYear}〜${project.endYear}`
              : project.startYear
                ? `${project.startYear}〜`
                : "—"
          }
        />
      </div>

      {/* 事業概要 */}
      {project.overview && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-800">
            事業概要
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {project.overview}
          </p>
          <a
            href={project.rsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-gov-blue hover:underline"
          >
            RSシステムで詳細を確認 →
          </a>
        </section>
      )}

      {/* 調達一覧 */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-800">
          関連調達案件 ({procurements.length}件)
        </h2>
        {procurements.length === 0 ? (
          <p className="text-sm text-gray-500">
            マッチした調達案件がありません。
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    案件名
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {procurements
                  .sort((a, b) => b.price - a.price)
                  .map((proc) => (
                    <tr key={proc.id} className="hover:bg-blue-50">
                      <td className="px-4 py-3 text-gray-800">{proc.name}</td>
                      <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                        {proc.awardDate
                          ? new Date(proc.awardDate).toLocaleDateString("ja-JP")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {proc.vendorName || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <BidMethodBadge method={proc.bidMethodName} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {formatAmount(proc.price)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetaCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight
          ? "border-gov-blue bg-gov-blue text-white"
          : "border-gray-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-medium ${highlight ? "text-blue-100" : "text-gray-500"}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

function BidMethodBadge({ method }: { method: string }) {
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

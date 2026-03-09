import { getDashboard, formatAmount } from "@/lib/data";

export default function DashboardPage() {
  const dash = getDashboard();
  const { summary, monthlyAwards, bidMethodSummary } = dash;

  const maxMonthlyAmount = Math.max(...monthlyAwards.map((m) => m.amount), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-gray-500">
          デジタル庁 IT事業・調達データ概況 ／ 最終更新:{" "}
          {new Date(dash.updatedAt).toLocaleDateString("ja-JP")}
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="IT事業数" value={`${summary.projectCount}事業`} />
        <StatCard
          label="調達件数"
          value={`${summary.procurementCount}件`}
        />
        <StatCard
          label="調達総額"
          value={formatAmount(summary.totalAmount)}
          highlight
        />
        <StatCard label="落札ベンダー数" value={`${summary.vendorCount}社`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 月別落札額推移 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            月別落札額推移
          </h2>
          <div className="space-y-2">
            {monthlyAwards.slice(-12).map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-right text-xs text-gray-500">
                  {m.month}
                </span>
                <div className="flex-1 rounded-full bg-gray-100 h-5 overflow-hidden">
                  <div
                    className="h-full bg-gov-light-blue rounded-full"
                    style={{
                      width: `${(m.amount / maxMonthlyAmount) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-gray-700">
                  {formatAmount(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 入札方式内訳 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            入札方式内訳
          </h2>
          <div className="space-y-3">
            {bidMethodSummary.map((b) => {
              const totalCount = bidMethodSummary.reduce(
                (s, x) => s + x.count,
                0
              );
              const pct = ((b.count / totalCount) * 100).toFixed(1);
              return (
                <div key={b.method} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 text-xs text-gray-600 truncate">
                    {b.method || "不明"}
                  </span>
                  <div className="flex-1 rounded-full bg-gray-100 h-4 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-gray-700">
                    {b.count}件 ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* クイックリンク */}
      <div className="flex gap-4">
        <a
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg bg-gov-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-gov-light-blue transition-colors"
        >
          IT事業一覧を見る →
        </a>
        <a
          href="/procurements"
          className="inline-flex items-center gap-2 rounded-lg border border-gov-blue px-5 py-2.5 text-sm font-medium text-gov-blue hover:bg-gov-blue hover:text-white transition-colors"
        >
          調達案件を見る →
        </a>
      </div>
    </div>
  );
}

function StatCard({
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
      className={`rounded-xl border p-5 shadow-sm ${
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
        className={`mt-1 text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}

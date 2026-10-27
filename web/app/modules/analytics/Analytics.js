// MODULE Analisis: picks the chart type for each breakdown.
import BarChart from './BarChart';
import GroupedBarChart from './GroupedBarChart';

export default function Analytics({ breakdowns }) {
  if (!breakdowns.length) return null;
  return (
    <div className="charts">
      {breakdowns.map((b) => (b.series?.length
        ? <GroupedBarChart key={b.key} title={b.title} source={b.source} series={b.series} items={b.items} updatedAt={b.updated_at} />
        : <BarChart key={b.key} title={b.title} source={b.source} items={b.items} updatedAt={b.updated_at} />))}
    </div>
  );
}

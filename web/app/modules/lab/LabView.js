// VIEW Jadual Makmal: the computer lab timetable, one week at a time, all labs.
// Public visitors see subject + class; logged-in admin/pentadbir also see the teacher.
import Link from 'next/link';
import { fmtDate } from '../ui/format';
import WeekPicker from './WeekPicker';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
const DAY_INDEX = { ISNIN: 1, SELASA: 2, RABU: 3, KHAMIS: 4, JUMAAT: 5 };

function LabGrid({ lab, slots, isCurrentWeek }) {
  const todayDay = new Date(`${today()}T12:00:00+08:00`).getDay();
  const at = {};
  slots.forEach((s) => { at[`${s.day}:${s.period}`] = s; });
  const covered = new Set();
  slots.forEach((s) => { for (let k = 1; k < (s.span || 1); k++) covered.add(`${s.day}:${s.period + k}`); });
  const booked = slots.length;
  return (
    <section className="lab">
      <h3>{lab.lab}<span className="count">{booked} slot ditempah</span></h3>
      <div className="table-scroll">
        <table className="lab-grid">
          <thead>
            <tr>
              <th>Hari</th>
              {lab.periods.map((p, i) => (
                <th key={i} className={`${p.session}${p.label === 'REHAT' ? ' break' : ''}`}>
                  <span>{p.label === 'REHAT' ? 'Rehat' : p.label}</span><small>{p.time}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lab.days.map((d) => (
              <tr key={d} className={isCurrentWeek && DAY_INDEX[d] === todayDay ? 'today' : undefined}>
                <th scope="row">{d.charAt(0) + d.slice(1).toLowerCase()}</th>
                {lab.periods.map((p, i) => {
                  const key = `${d}:${i}`;
                  if (covered.has(key)) return null;
                  const s = at[key];
                  if (p.label === 'REHAT') return <td key={i} className="break" aria-label="Rehat" />;
                  if (!s) return <td key={i} className="free"><span>Kosong</span></td>;
                  return (
                    <td key={i} colSpan={s.span || 1} className="booked" title={s.raw || undefined}>
                      <strong>{s.subject}</strong>
                      {s.class_name && <span>{s.class_name}</span>}
                      {s.teacher && <small>{s.teacher}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function LabView({ data, sourceUrl, loggedIn }) {
  if (!data?.weeks?.length) {
    return <p className="note">Jadual belum disegerakkan. Ia akan muncul selepas sync seterusnya (atau tekan Sync sekarang dalam Panel Admin).</p>;
  }
  const cur = data.weeks.find((w) => w.week === data.week);
  const isCurrent = data.week === data.currentWeek;
  return (
    <>
      <WeekPicker weeks={data.weeks} week={data.week} currentWeek={data.currentWeek} />
      <p className="muted lab-meta">
        {cur.start_date && <>{fmtDate(cur.start_date)} – {fmtDate(cur.end_date)} · </>}
        {isCurrent ? <strong>Minggu ini</strong> : <Link href="/?v=jadual" scroll={false}>Ke minggu ini</Link>}
        {!loggedIn && <> · Nama guru dipaparkan selepas log masuk</>}
        {sourceUrl && <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Buka jadual asal ↗</a></>}
      </p>
      {data.labs.map((lab) => (
        <LabGrid key={lab.lab} lab={lab} slots={data.slots.filter((s) => s.lab === lab.lab)} isCurrentWeek={isCurrent} />
      ))}
      <p className="legend-row muted"><span className="key booked" /> Ditempah <span className="key free" /> Kosong <span className="key today" /> Hari ini</p>
    </>
  );
}

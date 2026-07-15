import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseISO = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (iso, days) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const formatThai = (iso) => {
  if (!iso) return 'ยังไม่เลือก';
  return parseISO(iso).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const PRESETS = [
  { label: '3 วัน', days: 3 },
  { label: '5 วัน', days: 5 },
  { label: '7 วัน', days: 7 },
  { label: '14 วัน', days: 14 },
];

export default function DateRangePicker({
  startDate,
  endDate,
  minDate,
  onChange,
}) {
  const todayIso = minDate || toISODate(new Date());
  const today = parseISO(todayIso);
  const [view, setView] = useState(() => parseISO(startDate) || today);
  const [picking, setPicking] = useState(startDate && !endDate ? 'end' : 'start');

  const monthLabel = view.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];

    for (let i = 0; i < startPad; i += 1) list.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(new Date(year, month, day));
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const isDisabled = (date) => toISODate(date) < todayIso;

  const inRange = (date) => {
    if (!start || !end) return false;
    const t = date.getTime();
    return t > start.getTime() && t < end.getTime();
  };

  const isStart = (date) => startDate && toISODate(date) === startDate;
  const isEnd = (date) => endDate && toISODate(date) === endDate;

  const shiftMonth = (delta) => {
    setView((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDayClick = (date) => {
    if (isDisabled(date)) return;
    const iso = toISODate(date);

    if (picking === 'start' || !startDate || (startDate && endDate)) {
      onChange({ startDate: iso, endDate: '' });
      setPicking('end');
      return;
    }

    // picking end
    if (iso < startDate) {
      onChange({ startDate: iso, endDate: '' });
      setPicking('end');
      return;
    }

    onChange({ startDate, endDate: iso });
    setPicking('start');
  };

  const applyPreset = (days) => {
    const startIso = startDate && startDate >= todayIso ? startDate : todayIso;
    const endIso = addDays(startIso, days - 1);
    onChange({ startDate: startIso, endDate: endIso });
    setPicking('start');
    setView(parseISO(startIso));
  };

  const rentalDays = startDate && endDate
    ? Math.max(1, Math.ceil((parseISO(endDate) - parseISO(startDate)) / 86400000) + 1)
    : 0;

  const canGoPrev = (() => {
    const prevMonth = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    const lastOfPrev = new Date(view.getFullYear(), view.getMonth(), 0);
    return lastOfPrev >= today;
  })();

  return (
    <div className="date-range">
      <div className="date-range-summary">
        <button
          type="button"
          className={`date-pill ${picking === 'start' || !startDate ? 'is-active' : ''} ${startDate ? 'has-value' : ''}`}
          onClick={() => setPicking('start')}
        >
          <span className="date-pill-label">วันเริ่มเช่า</span>
          <span className="date-pill-value">{formatThai(startDate)}</span>
        </button>
        <div className="date-range-arrow" aria-hidden>→</div>
        <button
          type="button"
          className={`date-pill ${picking === 'end' ? 'is-active' : ''} ${endDate ? 'has-value' : ''}`}
          onClick={() => {
            if (!startDate) setPicking('start');
            else setPicking('end');
          }}
        >
          <span className="date-pill-label">วันคืนชุด</span>
          <span className="date-pill-value">{formatThai(endDate)}</span>
        </button>
      </div>

      <div className="date-presets">
        <span className="date-presets-label">เลือกลัด</span>
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            className={`date-preset-btn ${rentalDays === p.days ? 'is-active' : ''}`}
            onClick={() => applyPreset(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="date-calendar">
        <div className="date-cal-head">
          <button
            type="button"
            className="date-nav-btn"
            onClick={() => shiftMonth(-1)}
            disabled={!canGoPrev}
            aria-label="เดือนก่อน"
          >
            <ChevronLeft size={18} />
          </button>
          <strong>{monthLabel}</strong>
          <button
            type="button"
            className="date-nav-btn"
            onClick={() => shiftMonth(1)}
            aria-label="เดือนถัดไป"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="date-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="date-grid">
          {cells.map((date, idx) => {
            if (!date) return <span key={`e-${idx}`} className="date-cell empty" />;
            const iso = toISODate(date);
            const disabled = isDisabled(date);
            const classes = [
              'date-cell',
              disabled ? 'is-disabled' : '',
              isStart(date) ? 'is-start' : '',
              isEnd(date) ? 'is-end' : '',
              inRange(date) ? 'in-range' : '',
              iso === todayIso ? 'is-today' : '',
              sameMonth(date, view) ? '' : 'other-month',
            ].filter(Boolean).join(' ');

            return (
              <button
                key={iso}
                type="button"
                className={classes}
                disabled={disabled}
                onClick={() => handleDayClick(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <p className="date-hint">
        <CalendarDays size={14} />
        {picking === 'end' && startDate && !endDate
          ? 'ขั้นตอนถัดไป: เลือกวันคืนชุด'
          : 'แตะวันเริ่มเช่าก่อน แล้วเลือกวันคืนชุด หรือใช้ปุ่มลัดด้านบน'}
      </p>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';

// Nhãn được coi là "không xác định" → loại khỏi mọi thống kê.
const UNDEFINED_LABELS = new Set(['', 'không xác định', 'khong xac dinh', 'chưa xác định', 'chua xac dinh', 'n/a', 'na']);
const isUndefinedLabel = (s) => UNDEFINED_LABELS.has((s || '').trim().toLowerCase());

function BarCell({ count, max, color = '#0d6efd' }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{ flex: 1, height: 10, background: '#e9ecef', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.3s' }} />
      </div>
      <span className="text-muted" style={{ fontSize: '0.78rem', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// Ma trận: hàng (Người) × cột (Loại con) + tổng.
function MatrixTable({ title, firstColLabel, headerClass, badgeClass, cellBadge, barColor, matrix, onExport }) {
  const { rows, cols, grand } = matrix;
  const max = rows[0]?.total || 1;
  return (
    <div className="card mb-4">
      <div className={`card-header py-2 d-flex justify-content-between align-items-center ${headerClass}`}>
        <span className="fw-semibold">{title}</span>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${badgeClass}`}>{grand} tổng cộng</span>
          {rows.length > 0 && onExport && (
            <button className="btn btn-sm btn-light py-0 px-2" onClick={onExport} title="Export CSV">
              <i className="bi bi-download me-1"></i>CSV
            </button>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {rows.length === 0 ? (
          <div className="text-center text-muted py-4">Không có dữ liệu</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }} className="text-center align-middle">#</th>
                  <th className="align-middle">{firstColLabel}</th>
                  {cols.map((c) => (
                    <th key={c.key} className="text-center align-middle" style={{ minWidth: 80, fontSize: '0.78rem' }}>{c.label}</th>
                  ))}
                  <th style={{ width: 60 }} className="text-center align-middle">Tổng</th>
                  <th style={{ minWidth: 140 }} className="align-middle">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key}>
                    <td className="text-center text-muted">{i + 1}</td>
                    <td className="fw-medium">{row.label}</td>
                    {cols.map((c) => (
                      <td key={c.key} className="text-center">
                        {row.byCol[c.key]
                          ? <span className={`badge ${cellBadge}`}>{row.byCol[c.key]}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                    ))}
                    <td className="text-center"><span className="badge bg-dark">{row.total}</span></td>
                    <td><BarCell count={row.total} max={max} color={barColor} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-light fw-semibold">
                <tr>
                  <td colSpan={2} className="text-end text-muted small">Tổng cột</td>
                  {cols.map((c) => (
                    <td key={c.key} className="text-center small">{c.total || '—'}</td>
                  ))}
                  <td className="text-center">{grand}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Bảng xếp hạng đơn (Lý Do Lỗi / Loại con). Cột Tỷ lệ = phần trăm trên tổng.
function BreakdownTable({ title, label, headerClass, badgeClass, rowBadge, barColor, breakdown, onExport }) {
  const { rows, total } = breakdown;
  return (
    <div className="card h-100">
      <div className={`card-header py-2 d-flex justify-content-between align-items-center ${headerClass}`}>
        <span className="fw-semibold">{title}</span>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${badgeClass}`}>{total} tổng cộng</span>
          {rows.length > 0 && onExport && (
            <button className="btn btn-sm btn-light py-0 px-2" onClick={onExport} title="Export CSV">
              <i className="bi bi-download me-1"></i>CSV
            </button>
          )}
        </div>
      </div>
      <div className="card-body p-0">
        {rows.length === 0 ? (
          <div className="text-center text-muted py-4">Không có dữ liệu</div>
        ) : (
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 36 }} className="text-center">#</th>
                <th>{label}</th>
                <th style={{ width: 60 }} className="text-center">Số lần</th>
                <th style={{ width: 160 }}>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.key}>
                  <td className="text-center text-muted">{i + 1}</td>
                  <td className="fw-medium">{row.label}</td>
                  <td className="text-center"><span className={`badge ${rowBadge}`}>{row.count}</span></td>
                  <td><BarCell count={row.count} max={total} color={barColor} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan={2} className="text-end text-muted small">Tổng cộng</td>
                <td className="text-center fw-bold">{total}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ReportByLineItem() {
  const [reprints, setReprints] = useState({});
  const [userReprints, setUserReprints] = useState({});
  const [reasonErrors, setReasonErrors] = useState({});
  const [reasons, setReasons] = useState({}); // Lý Do Reprint
  const [reprintTypes, setReprintTypes] = useState({});
  const [productReprints, setProductReprints] = useState({});
  const [loading, setLoading] = useState(true);

  // ── Filters ──
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().substring(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().substring(0, 10));
  const [selectedType, setSelectedType] = useState(''); // reprint_type_id đang chọn

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, ur, re, rt, pr, rs] = await Promise.all([
        window.electronAPI.db.reprints.getAll(),
        window.electronAPI.db.userReprints.getAll(),
        window.electronAPI.db.reasonErrors.getAll(),
        window.electronAPI.db.reprintTypes.getAll(),
        window.electronAPI.db.productReprints.getAll(),
        window.electronAPI.db.reasons.getAll(),
      ]);
      setReprints(r);
      setUserReprints(ur);
      setReasonErrors(re);
      setReprintTypes(rt);
      setProductReprints(pr);
      setReasons(rs);
    } catch (err) {
      console.error('ReportByLineItem load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const typeOpts = Object.entries(reprintTypes).sort(([a], [b]) => Number(a) - Number(b));

  // Mặc định chọn sản phẩm đầu tiên khi data sẵn sàng
  useEffect(() => {
    if (!selectedType && typeOpts.length > 0) {
      setSelectedType(typeOpts[0][0]);
    }
  }, [typeOpts, selectedType]);

  // ── Lọc theo ngày + đúng sản phẩm đang chọn ──
  const productFiltered = Object.values(reprints).filter((r) => {
    if (selectedType && String(r.reprint_type_id) !== selectedType) return false;
    const date = (r.created_at || '').substring(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  });

  const totalTickets = productFiltered.length;

  // Nhãn loại con; bỏ qua nếu trống / "không xác định"
  const subLabel = (pid) => {
    if (!pid) return null;
    const name = (productReprints[pid]?.name || '').trim();
    if (isUndefinedLabel(name)) return null;
    return name || `#${pid}`;
  };

  // ── 1) Ma trận Người Làm Sai × Loại con ──
  const whoMatrix = (() => {
    const rowMap = {};
    const colMap = {};
    let grand = 0;
    productFiltered.forEach((r) => {
      if (!r.user_error_id) return;
      const slabel = subLabel(r.product_reprint_id);
      if (!slabel) return; // loại bỏ phiếu không có loại con xác định
      const ukey = String(r.user_error_id);
      const ulabel = userReprints[ukey]?.name || `User #${ukey}`;
      const skey = String(r.product_reprint_id);
      if (!rowMap[ukey]) rowMap[ukey] = { key: ukey, label: ulabel, total: 0, byCol: {} };
      rowMap[ukey].total++;
      rowMap[ukey].byCol[skey] = (rowMap[ukey].byCol[skey] || 0) + 1;
      if (!colMap[skey]) colMap[skey] = { key: skey, label: slabel, total: 0 };
      colMap[skey].total++;
      grand++;
    });
    return {
      rows: Object.values(rowMap).sort((a, b) => b.total - a.total),
      cols: Object.values(colMap).sort((a, b) => b.total - a.total),
      grand,
    };
  })();

  // ── 2) Tổng theo Lý Do Reprint (bỏ "không xác định") ──
  const reasonReprintBreakdown = (() => {
    const map = {};
    let total = 0;
    productFiltered.forEach((r) => {
      const id = r.reason_reprint_id;
      if (!id) return;
      const label = (reasons[id]?.name || '').trim();
      if (!label || isUndefinedLabel(label)) return;
      const key = `rr:${id}`;
      if (!map[key]) map[key] = { key, label, count: 0 };
      map[key].count++;
      total++;
    });
    return { rows: Object.values(map).sort((a, b) => b.count - a.count), total };
  })();

  // ── 3) Tổng theo Lý Do Lỗi (bỏ "không xác định") ──
  const reasonBreakdown = (() => {
    const map = {};
    let total = 0;
    productFiltered.forEach((r) => {
      let label = null;
      let key = null;
      if (r.reason_error_id && reasonErrors[r.reason_error_id]) {
        label = reasonErrors[r.reason_error_id].name.trim();
        key = `re:${r.reason_error_id}`;
      } else if ((r.reason_error || '').trim()) {
        label = r.reason_error.trim();
        key = `rt:${label.toLowerCase()}`;
      }
      if (!label || isUndefinedLabel(label)) return; // bỏ qua không xác định
      if (!map[key]) map[key] = { key, label, count: 0 };
      map[key].count++;
      total++;
    });
    return { rows: Object.values(map).sort((a, b) => b.count - a.count), total };
  })();

  // ── 4) Tổng theo Loại con + tỉ lệ (bỏ "không xác định") ──
  const subtypeBreakdown = (() => {
    const map = {};
    let total = 0;
    productFiltered.forEach((r) => {
      const slabel = subLabel(r.product_reprint_id);
      if (!slabel) return;
      const key = String(r.product_reprint_id);
      if (!map[key]) map[key] = { key, label: slabel, count: 0 };
      map[key].count++;
      total++;
    });
    return { rows: Object.values(map).sort((a, b) => b.count - a.count), total };
  })();

  const selectedTypeName = selectedType ? (reprintTypes[selectedType]?.name || `Type #${selectedType}`) : '';

  // ── CSV ──
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  function downloadCSV(csvLines, filename) {
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportBreakdownCSV(breakdown, label, slug) {
    const lines = [['#', label, 'Số lần', 'Tỷ lệ %'].map(esc).join(',')];
    breakdown.rows.forEach((row, i) => {
      const pct = breakdown.total > 0 ? Math.round((row.count / breakdown.total) * 100) : 0;
      lines.push([i + 1, row.label, row.count, pct].map(esc).join(','));
    });
    lines.push(['', 'Tổng cộng', breakdown.total, ''].map(esc).join(','));
    downloadCSV(lines, `${slug}_${selectedTypeName}_${dateFrom}_${dateTo}.csv`);
  }

  function exportWhoMatrixCSV() {
    const { rows, cols, grand } = whoMatrix;
    const headers = ['#', 'Người Làm Sai', ...cols.map((c) => c.label), 'Tổng'];
    const dataRows = rows.map((row, i) =>
      [i + 1, row.label, ...cols.map((c) => row.byCol[c.key] || 0), row.total].map(esc).join(',')
    );
    const footer = ['Tổng cột', '', ...cols.map((c) => c.total || 0), grand].map(esc).join(',');
    downloadCSV([headers.map(esc).join(','), ...dataRows, footer], `nguoi-lam-sai_${selectedTypeName}_${dateFrom}_${dateTo}.csv`);
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Lỗi Theo Sản Phẩm</h4>
        <div className="d-flex gap-2 align-items-end">
          <div>
            <label className="form-label mb-0 small fw-semibold">Từ ngày</label>
            <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label mb-0 small fw-semibold">Đến ngày</label>
            <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Chọn sản phẩm — mỗi lúc 1 sản phẩm */}
      {typeOpts.length === 0 ? (
        <div className="text-center text-muted py-5">Chưa có sản phẩm nào</div>
      ) : (
        <>
          <ul className="nav nav-pills mb-3 flex-wrap gap-1">
            {typeOpts.map(([id, t]) => (
              <li className="nav-item" key={id}>
                <button
                  className={`nav-link ${selectedType === id ? 'active' : ''}`}
                  onClick={() => setSelectedType(id)}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>

          {/* Tóm tắt sản phẩm đang chọn */}
          <div className="d-flex gap-3 mb-3 text-muted small">
            <span><strong className="text-dark">{selectedTypeName}</strong></span>
            <span>·</span>
            <span><strong className="text-dark">{totalTickets}</strong> phiếu reprint</span>
            <span>·</span>
            <span><strong style={{ color: '#0d6efd' }}>{reasonReprintBreakdown.total}</strong> có lý do reprint</span>
            <span>·</span>
            <span><strong style={{ color: '#fd7e14' }}>{reasonBreakdown.total}</strong> có lý do lỗi</span>
            <span>·</span>
            <span><strong className="text-danger">{whoMatrix.grand}</strong> có người làm sai + loại con</span>
          </div>

          {/* 1) Người Làm Sai × Loại con */}
          <MatrixTable
            title="Người Làm Sai Theo Loại Con"
            firstColLabel="Người Làm Sai"
            headerClass="bg-danger text-white"
            badgeClass="bg-light text-danger"
            cellBadge="bg-danger"
            barColor="#dc3545"
            matrix={whoMatrix}
            onExport={exportWhoMatrixCSV}
          />

          {/* 2) Lý Do Reprint + 3) Lý Do Lỗi + 4) Loại con */}
          <div className="row g-4">
            <div className="col-lg-4">
              <BreakdownTable
                title="Tổng Reprint Theo Lý Do Reprint"
                label="Lý Do Reprint"
                headerClass="bg-primary text-white"
                badgeClass="bg-light text-primary"
                rowBadge="bg-primary"
                barColor="#0d6efd"
                breakdown={reasonReprintBreakdown}
                onExport={() => exportBreakdownCSV(reasonReprintBreakdown, 'Lý Do Reprint', 'line-item_ly-do-reprint')}
              />
            </div>
            <div className="col-lg-4">
              <BreakdownTable
                title="Tổng Reprint Theo Lý Do Lỗi"
                label="Lý Do Lỗi"
                headerClass="bg-warning text-dark"
                badgeClass="bg-light text-warning border"
                rowBadge="bg-warning text-dark"
                barColor="#ffc107"
                breakdown={reasonBreakdown}
                onExport={() => exportBreakdownCSV(reasonBreakdown, 'Lý Do Lỗi', 'line-item_ly-do-loi')}
              />
            </div>
            <div className="col-lg-4">
              <BreakdownTable
                title="Tổng Reprint Theo Loại Con (Tỉ Lệ)"
                label="Loại Con"
                headerClass="bg-success text-white"
                badgeClass="bg-light text-success"
                rowBadge="bg-success"
                barColor="#198754"
                breakdown={subtypeBreakdown}
                onExport={() => exportBreakdownCSV(subtypeBreakdown, 'Loại Con', 'line-item_loai-con')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

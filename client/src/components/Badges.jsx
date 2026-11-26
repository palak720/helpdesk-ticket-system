const label = (s) => s.replace('_', ' ');
export const StatusBadge = ({ value }) => <span className={`badge s-${value}`}>{label(value)}</span>;
export const PriorityBadge = ({ value }) => <span className={`badge p-${value}`}>{label(value)}</span>;

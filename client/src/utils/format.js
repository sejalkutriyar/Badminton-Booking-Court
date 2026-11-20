export const toLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

export const formatDate = (dateString) => {
    const date = parseLocalDate(dateString);
    if (!date) return 'Unknown date';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

export const formatMoney = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) return '₹0';
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const isPastBooking = (booking, now = new Date()) => {
    const date = parseLocalDate(booking.date);
    if (!date) return false;
    const [hours, minutes] = String(booking.start_time || '00:00').split(':').map(Number);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date < now;
};

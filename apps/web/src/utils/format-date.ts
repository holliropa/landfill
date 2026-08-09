const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date) {
  return formatValidDate(value, dateFormatter);
}

export function formatDateTime(value: Date) {
  return formatValidDate(value, dateTimeFormatter);
}

function formatValidDate(value: Date, formatter: Intl.DateTimeFormat) {
  if (Number.isNaN(value.getTime())) return "Unknown date";
  return formatter.format(value);
}

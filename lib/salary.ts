const HOURS_PER_YEAR = 2080;

type NormalizedSalary = {
  annual: number | null;
  hourly: number | null;
};

function extractNumbers(value: string) {
  return (
    value
      .match(/\d[\d,]*(?:\.\d+)?/g)
      ?.map((item) => Number(item.replace(/,/g, "")))
      .filter((item) => Number.isFinite(item) && item > 0) ?? []
  );
}

function isHourlySalary(value: string, numbers: number[]) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("hour") ||
    normalized.includes("/hr") ||
    normalized.includes("per hr") ||
    normalized.includes("hourly")
  ) {
    return true;
  }

  return numbers.length > 0 && Math.max(...numbers) <= 300;
}

function isAnnualSalary(value: string, numbers: number[]) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("year") ||
    normalized.includes("/yr") ||
    normalized.includes("annum") ||
    normalized.includes("annual")
  ) {
    return true;
  }

  return numbers.length > 0 && Math.max(...numbers) > 1000;
}

function average(numbers: number[]) {
  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((total, item) => total + item, 0) / numbers.length;
}

export function normalizeSalary(value: string): NormalizedSalary {
  const numbers = extractNumbers(value);
  const midpoint = average(numbers);

  if (midpoint === null) {
    return {
      annual: null,
      hourly: null,
    };
  }

  if (isHourlySalary(value, numbers)) {
    return {
      annual: midpoint * HOURS_PER_YEAR,
      hourly: midpoint,
    };
  }

  if (isAnnualSalary(value, numbers)) {
    return {
      annual: midpoint,
      hourly: midpoint / HOURS_PER_YEAR,
    };
  }

  return {
    annual: null,
    hourly: null,
  };
}

function formatAnnual(value: number) {
  return `$${(value / 1000).toFixed(1)}k/yr`;
}

function formatHourly(value: number) {
  return `$${value.toFixed(2)}/hr`;
}

export function formatNormalizedSalary(value: string) {
  const salary = normalizeSalary(value);

  if (salary.hourly === null || salary.annual === null) {
    return "Salary not listed";
  }

  return `${formatHourly(salary.hourly)} (${formatAnnual(salary.annual)})`;
}

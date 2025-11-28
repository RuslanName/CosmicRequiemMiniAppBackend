export function formatTo8Digits(number: number): string {
  return number.toString().padStart(8, '0');
}

export function generateRandom8DigitCode(): string {
  const min = 10000000;
  const max = 99999999;
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber.toString();
}

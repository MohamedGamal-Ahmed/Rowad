export class Clock {
  private static mockTime: Date | null = null;

  /**
   * Overrides the current system time for testing or deterministic execution.
   */
  public static setMockTime(date: Date | null): void {
    Clock.mockTime = date;
  }

  /**
   * Returns the current date-time representation.
   */
  public static now(): Date {
    if (Clock.mockTime) {
      return new Date(Clock.mockTime.getTime());
    }
    return new Date();
  }

  /**
   * Returns today's date with time set to midnight.
   */
  public static today(): Date {
    const d = Clock.now();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Returns today's date formatted as a standard YYYY-MM-DD ISO string.
   */
  public static todayISO(): string {
    return Clock.now().toISOString().split('T')[0];
  }

  /**
   * Parses an ISO date string safely into a Date object.
   */
  public static parse(dateStr: string): Date {
    return new Date(dateStr);
  }

  /**
   * Calculates the integer difference in days between two dates.
   * If baseDate is omitted, it defaults to the current Clock.now() time.
   */
  public static diffInDays(targetDateStr: string, baseDateStr?: string): number {
    const target = Clock.parse(targetDateStr);
    const base = baseDateStr ? Clock.parse(baseDateStr) : Clock.now();
    
    // Clear times for exact day boundary differences
    const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const baseDate = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    
    const diffTime = targetDate.getTime() - baseDate.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  }
}

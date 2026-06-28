import { useMemo } from 'react';
import { CalendarEvent } from '../types';

export interface AgendaGroup {
  dateString: string;
  formattedDate: { en: string; ar: string };
  events: CalendarEvent[];
}

export function useAgenda(events: CalendarEvent[]) {
  const sortedAndGroupedAgenda = useMemo(() => {
    // Sort events chronologically by startDate, then startTime
    const sorted = [...events].sort((a, b) => {
      const dateDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      const timeA = a.startTime || '00:00';
      const timeB = b.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    // Group by date
    const groups: { [key: string]: CalendarEvent[] } = {};
    sorted.forEach(e => {
      if (!groups[e.startDate]) {
        groups[e.startDate] = [];
      }
      groups[e.startDate].push(e);
    });

    // Translate to an array of groups with friendly localizations
    const list: AgendaGroup[] = Object.keys(groups).sort().map(dateStr => {
      const dateObj = new Date(dateStr);
      const enOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      const arOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', calendar: 'gregory' };
      
      return {
        dateString: dateStr,
        formattedDate: {
          en: dateObj.toLocaleDateString('en-US', enOptions),
          ar: dateObj.toLocaleDateString('ar-EG', arOptions)
        },
        events: groups[dateStr]
      };
    });

    return list;
  }, [events]);

  return sortedAndGroupedAgenda;
}

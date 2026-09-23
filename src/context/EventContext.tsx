'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface EventSummary {
  id: string;
  name: string;
  date: string;
  location?: string | null;
  _count?: {
    customers: number;
    items: number;
  };
}

interface EventContextType {
  events: EventSummary[];
  selectedEventId: string | null;
  selectedEvent: EventSummary | null;
  setSelectedEventId: (id: string) => void;
  refreshEvents: () => Promise<void>;
  loading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);

        if (data.events?.length > 0) {
          // Keep current selection if valid, or pick first
          setSelectedEventId((prev) => {
            if (prev && data.events.some((e: EventSummary) => e.id === prev)) {
              return prev;
            }
            return data.events[0].id;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  return (
    <EventContext.Provider
      value={{
        events,
        selectedEventId,
        selectedEvent,
        setSelectedEventId,
        refreshEvents: fetchEvents,
        loading,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

import { useEffect, useState } from "react";

export type EventItem = {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  tags: string[];
  link?: string;
  emoji?: string;
};

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/15Jw7Nn1Bo3raRXQz5vm2iuPdh-FgFBoMtUveJX6Q2NA/export?format=csv";

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(res => res.text())
      .then(csv => {
        const rows = csv.trim().split("\n").slice(1);

        const data: EventItem[] = rows.map((row, index) => {
          const [
            id,
            title,
            date,
            time,
            location,
            category,
            description,
            tags,
            link,
            emoji
          ] = row.split(",");

          return {
            id: id || index,
            title: title || "",
            date: date || "",
            time: time || "",
            location: location || "",
            category: category || "community",
            description: description || "",
            tags: tags ? tags.split("|") : [],
            link: link || "",
            emoji: emoji || "📌"
          };
        });

        setEvents(data);
      })
      .catch(err => {
        console.error("Sheet loading failed:", err);
      });
  }, []);

  return events;
}
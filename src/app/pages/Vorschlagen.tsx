import { useState, type ChangeEvent, type FormEvent } from "react";

export default function Vorschlagen() {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    queerLevel: "queer-friendly",
    emoji: "",
    description: "",
    tags: "",
    link: "",
  });

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = `Eventvorschlag: ${form.title}`;
    const body = [
      `Name des Events: ${form.title}`,
      `Datum: ${form.date}`,
      `Uhrzeit: ${form.time}`,
      `Location: ${form.location}`,
      `Veranstalter: ${form.organizer}`,
      `Queer-Level: ${form.queerLevel}`,
      `Emoji: ${form.emoji || "-"}`,
      `Beschreibung: ${form.description || "-"}`,
      `Tags: ${form.tags || "-"}`,
      `Link: ${form.link}`,
    ].join("\n");

    const mailto = `mailto:miriam.peters@outlook.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <main className="px-4 pb-32">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Event vorschlagen</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Trage hier die Informationen zum Event ein. Alle Felder sind Pflichtfelder, außer Beschreibung und Tags.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2">Name des Events *</label>
            <input
              type="text"
              value={form.title}
              onChange={handleChange("title")}
              required
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Datum *</label>
              <input
                type="date"
                value={form.date}
                onChange={handleChange("date")}
                required
                className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Uhrzeit *</label>
              <input
                type="time"
                value={form.time}
                onChange={handleChange("time")}
                required
                className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={form.location}
              onChange={handleChange("location")}
              required
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Veranstalter *</label>
            <input
              type="text"
              value={form.organizer}
              onChange={handleChange("organizer")}
              required
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Queer-Level *</label>
              <select
                value={form.queerLevel}
                onChange={handleChange("queerLevel")}
                required
                className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
              >
                <option value="queer-friendly">queer-friendly</option>
                <option value="queer-focused">queer-focused</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Emoji 🎨✊🪩</label>
              <input
                type="text"
                value={form.emoji}
                onChange={handleChange("emoji")}
                className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
                placeholder="z. B. 🎶"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={handleChange("tags")}
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
              placeholder="z. B. queer, party, kultur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Link *</label>
            <input
              type="url"
              value={form.link}
              onChange={handleChange("link")}
              required
              className="w-full rounded-2xl border border-white/10 bg-secondary px-4 py-3 text-sm text-foreground focus:border-fuchsia-500/50 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
          >
            Vorschlag absenden
          </button>
        </form>
      </div>
    </main>
  );
}

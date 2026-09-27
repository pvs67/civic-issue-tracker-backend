window.NexgenAI = {
  analyze(title, description, existing = []) {
    const blob = `${title} ${description}`.toLowerCase();
    const hints = {
      Health: [
        "hospital",
        "clinic",
        "health",
        "disease",
        "doctor",
        "sanitation",
        "mosquito",
        "medical",
      ],
      Education: [
        "school",
        "college",
        "student",
        "education",
        "teacher",
        "library",
      ],
      Agriculture: ["farm", "crop", "farmer", "irrigation", "soil", "seed"],
      Environment: [
        "pollution",
        "waste",
        "garbage",
        "tree",
        "river",
        "air",
        "plastic",
        "climate",
      ],
      Infrastructure: [
        "road",
        "pothole",
        "street",
        "light",
        "water",
        "drain",
        "bridge",
        "bus",
        "power",
        "housing",
      ],
    };
    const scores = Object.fromEntries(
      Object.entries(hints).map(([k, words]) => [
        k,
        words.filter((w) => blob.includes(w)).length,
      ]),
    );
    const category = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][1]
      ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
      : "Other";

    const high = [
      "death",
      "accident",
      "collapse",
      "outbreak",
      "flood",
      "fire",
      "contaminated",
      "shortage",
      "unsafe",
      "emergency",
    ];
    const medium = [
      "broken",
      "garbage",
      "pollution",
      "leak",
      "pothole",
      "dark",
      "school",
      "delay",
    ];
    const priority = high.some((w) => blob.includes(w))
      ? "High"
      : medium.some((w) => blob.includes(w))
        ? "Medium"
        : "Low";

    const keywords = (blob.match(/[a-z]{4,}/g) || [])
      .filter(
        (w) =>
          ![
            "this",
            "that",
            "with",
            "from",
            "have",
            "there",
            "their",
            "about",
          ].includes(w),
      )
      .filter((w, i, arr) => arr.indexOf(w) === i)
      .slice(0, 6);

    let summary = (description || title || "").trim();
    if (summary.length > 180) summary = summary.slice(0, 177) + "…";

    const tokenize = (t) =>
      new Set((t || "").toLowerCase().match(/[a-z]{4,}/g) || []);
    const a = tokenize(title);
    let duplicate = null;
    for (const issue of existing) {
      const b = tokenize(issue.title);
      const inter = [...a].filter((x) => b.has(x)).length;
      const union = new Set([...a, ...b]).size || 1;
      if (inter / union > 0.55) {
        duplicate = { id: issue.id, title: issue.title };
        break;
      }
    }

    const universities = NGX.universities
      .filter((u) => u.expertise.includes(category))
      .slice(0, 3);
    return {
      category,
      priority,
      keywords: keywords.length ? keywords : ["civic", "community"],
      summary: summary || "Citizen-reported civic challenge pending review.",
      duplicate,
      universities: universities.length
        ? universities
        : NGX.universities.slice(0, 2),
    };
  },
};

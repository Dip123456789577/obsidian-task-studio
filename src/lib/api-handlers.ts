export function handleApiRequest(url: URL, _request?: Request): Response | null {
  if (url.pathname === "/api/health") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        app: "TASKFORGE",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        features: [
          "obsidian-dark-ui",
          "kanban-board",
          "calendar-matrix",
          "productivity-intelligence",
          "guest-demo-mode",
          "data-portability-json-csv",
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    );
  }

  if (url.pathname === "/api/templates") {
    return new Response(
      JSON.stringify({
        templates: [
          {
            id: "tmpl-sprint",
            title: "Sprint Planning & Execution",
            category: "Work",
            priority: "high",
            tags: ["sprint", "engineering", "milestone"],
            subtasks: [
              "Define sprint goals and scope",
              "Review backlog items & assign story points",
              "Execute daily standups and unblock dependencies",
              "Conduct sprint review and retrospective",
            ],
          },
          {
            id: "tmpl-deepwork",
            title: "Deep Work & Flow State Block",
            category: "Personal",
            priority: "urgent",
            tags: ["focus", "productivity"],
            subtasks: [
              "Close email and communication tabs",
              "Set 90-minute focus timer",
              "Produce primary deliverable draft",
              "Log accomplishments in notes",
            ],
          },
          {
            id: "tmpl-weekly-review",
            title: "Weekly Productivity & Goal Review",
            category: "Study",
            priority: "medium",
            tags: ["review", "habits"],
            subtasks: [
              "Review inbox & empty pending tasks",
              "Analyze weekly completion metrics",
              "Set top 3 priorities for coming week",
            ],
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }

  return null;
}

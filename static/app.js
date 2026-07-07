(() => {
  const keywordInput = document.getElementById("keyword-input");
  const generateBtn = document.getElementById("generate-btn");
  const pipeline = document.getElementById("pipeline");
  const errorCard = document.getElementById("error-card");
  const errorMessage = document.getElementById("error-message");
  const retryBtn = document.getElementById("retry-btn");
  const results = document.getElementById("results");
  const exportBtn = document.getElementById("export-btn");

  const agents = {
    research: document.getElementById("agent-research"),
    blog: document.getElementById("agent-blog"),
    social: document.getElementById("agent-social"),
  };

  const PHRASES = {
    research: [
      "Scanning top-ranking content...",
      "Analyzing competitor angles...",
      "Finding content gaps...",
    ],
    blog: [
      "Structuring the post...",
      "Writing the hook...",
      "Weaving in research stats...",
    ],
    social: [
      "Adapting tone per platform...",
      "Compressing to 280 characters...",
      "Tuning hashtags...",
    ],
  };

  const STAGE_TIMINGS = [
    { stage: "research", at: 0 },
    { stage: "blog", at: 25000 },
    { stage: "social", at: 50000 },
  ];

  let phraseTimer = null;
  let stageTimers = [];
  let lastKeyword = "";

  function setAgentState(key, state) {
    agents[key].dataset.state = state;
  }

  function setAgentPhrase(key, text) {
    agents[key].querySelector(".agent-status").textContent = text;
  }

  function startPhraseCycle(key) {
    const phrases = PHRASES[key];
    let i = 0;
    setAgentPhrase(key, phrases[0]);
    return setInterval(() => {
      i = (i + 1) % phrases.length;
      setAgentPhrase(key, phrases[i]);
    }, 2500);
  }

  function resetPipeline() {
    Object.keys(agents).forEach((key) => {
      setAgentState(key, "idle");
      setAgentPhrase(key, "Idle");
    });
  }

  function startPipelineAnimation() {
    clearInterval(phraseTimer);
    stageTimers.forEach((t) => clearTimeout(t));
    stageTimers = [];

    resetPipeline();
    pipeline.hidden = false;

    const order = ["research", "blog", "social"];

    const advanceTo = (index) => {
      clearInterval(phraseTimer);
      order.forEach((key, i) => {
        if (i < index) setAgentState(key, "done");
      });
      const current = order[index];
      setAgentState(current, "running");
      phraseTimer = startPhraseCycle(current);
    };

    advanceTo(0);

    STAGE_TIMINGS.slice(1).forEach((entry, i) => {
      const index = i + 1;
      const timer = setTimeout(() => advanceTo(index), entry.at);
      stageTimers.push(timer);
    });
  }

  function finishPipelineAnimation() {
    clearInterval(phraseTimer);
    stageTimers.forEach((t) => clearTimeout(t));
    stageTimers = [];
    Object.keys(agents).forEach((key) => setAgentState(key, "done"));
  }

  function stopPipelineAnimation() {
    clearInterval(phraseTimer);
    stageTimers.forEach((t) => clearTimeout(t));
    stageTimers = [];
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorCard.hidden = false;
  }

  function hideError() {
    errorCard.hidden = true;
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled";
  }

  let latestData = null;

  const SOCIAL_LABELS = {
    twitter: "Twitter",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
  };

  function renderResults(data) {
    latestData = data;

    document.getElementById("research-content").innerHTML = marked.parse(
      data.research || ""
    );
    document.getElementById("blog-content").innerHTML = marked.parse(
      data.blog_post || ""
    );
    document.getElementById("word-count-badge").textContent = `${
      data.word_count || 0
    } words`;

    const tabPanels = document.getElementById("tab-panels");
    tabPanels.innerHTML = "";
    Object.keys(SOCIAL_LABELS).forEach((platform, i) => {
      const panel = document.createElement("div");
      panel.className = "tab-panel" + (i === 0 ? " active" : "");
      panel.id = `tab-panel-${platform}`;

      const actions = document.createElement("div");
      actions.className = "tab-panel-actions";
      const copyBtn = document.createElement("button");
      copyBtn.className = "btn-copy";
      copyBtn.dataset.copyTarget = `social-${platform}`;
      copyBtn.textContent = "Copy";
      actions.appendChild(copyBtn);

      const pre = document.createElement("pre");
      pre.className = "mono-block";
      pre.id = `social-${platform}-content`;
      pre.textContent = (data.variants && data.variants[platform]) || "";

      panel.appendChild(actions);
      panel.appendChild(pre);
      tabPanels.appendChild(panel);
    });

    results.hidden = false;
  }

  function getCopyText(target) {
    if (target === "research") return latestData.research || "";
    if (target === "blog") return latestData.blog_post || "";
    if (target.startsWith("social-")) {
      const platform = target.replace("social-", "");
      return (latestData.variants && latestData.variants[platform]) || "";
    }
    return "";
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-copy");
    if (!btn) return;
    const text = getCopyText(btn.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "Copied ✓";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1500);
    } catch (err) {
      /* clipboard unavailable, ignore */
    }
  });

  document.addEventListener("click", (e) => {
    const header = e.target.closest(".panel-header");
    if (!header) return;
    header.closest(".panel").classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab-btn");
    if (!tabBtn) return;
    const platform = tabBtn.dataset.platform;

    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.toggle("active", b === tabBtn));
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === `tab-panel-${platform}`);
    });
  });

  exportBtn.addEventListener("click", () => {
    if (!latestData) return;
    const d = latestData;
    const parts = [
      `# Content Factory Export: ${d.keyword}`,
      "",
      "## Research",
      "",
      d.research || "",
      "",
      "## Blog Post",
      "",
      d.blog_post || "",
      "",
      "## Social Variants",
      "",
    ];
    Object.keys(SOCIAL_LABELS).forEach((platform) => {
      parts.push(`### ${SOCIAL_LABELS[platform]}`, "");
      parts.push((d.variants && d.variants[platform]) || "", "");
    });

    const blob = new Blob([parts.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-factory-${slugify(d.keyword)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  async function generate(keyword) {
    hideError();
    results.hidden = true;
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    startPipelineAnimation();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body && body.detail) detail = body.detail;
        } catch (_) {
          /* ignore parse error */
        }
        throw new Error(detail);
      }

      const data = await res.json();
      finishPipelineAnimation();
      renderResults(data);
    } catch (err) {
      stopPipelineAnimation();
      pipeline.hidden = true;
      showError(err.message || "Something went wrong. Please try again.");
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate";
    }
  }

  function handleGenerate() {
    const keyword = keywordInput.value.trim();
    if (!keyword) {
      keywordInput.focus();
      return;
    }
    lastKeyword = keyword;
    generate(keyword);
  }

  generateBtn.addEventListener("click", handleGenerate);

  keywordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  });

  retryBtn.addEventListener("click", () => {
    if (lastKeyword) generate(lastKeyword);
  });
})();
